# Tasarım Notları

Bu dokümanda projenin genel yapısını ve aldığım kararları topladım. Amaç, bir yatırım fonunun paylarını testnet üzerinde token olarak temsil edip giriş/çıkış, NAV güncelleme ve yatırımcı onayı akışlarını uçtan uca çalıştırmak.

Genel olarak basit tutmaya çalıştım: hazır ve denetlenmiş parçaları (OpenZeppelin) kullanmak, her parçaya tek bir sorumluluk vermek ve gerçekten ihtiyaç olmayan şeyi eklememek.

## Genel yapı

- Zincir olarak Sepolia kullanıyorum. MetaMask'te hazır geliyor ve Etherscan üzerinde verify etmek kolay.
- Kontratlar Solidity + Foundry ile yazılıyor.
- Frontend Vite + React + TypeScript, zincirle konuşmak için wagmi/viem.
- Backend Python (FastAPI). Sadece zincirdeki event'leri okuyup geçmişi sunuyor, zincire bir şey yazmıyor.
- Frontend Vercel'de, backend Render'da (Docker) çalışacak.

Fonun asıl durumu kontratlarda. Frontend okumaları RPC üzerinden, yazma işlemlerini kullanıcının cüzdanı üzerinden yapıyor. Backend'e sadece işlem ve NAV geçmişi için gidiyor; backend kapalı olsa bile giriş/çıkış ve yönetici işlemleri çalışmaya devam eder.

Klasör yapısı:

```
contracts/     Foundry projesi (src, test, script)
backend/       FastAPI servisi ve indexer
web/           React uygulaması
deployments/   ağ bazında kontrat adresleri
docs/          bu doküman
```

## Kontratlar

Üç kontrat var.

**MockUSDC:** Ödeme için kullanılan test tokenı. Gerçek USDC gibi 6 ondalıklı. Demo kolaylığı için `mint` herkese açık.

**InvestorRegistry:** Onaylı yatırımcı listesi. Yönetici (`MANAGER_ROLE`) adres ekleyip çıkarabiliyor, `isApproved` ile herkes sorgulayabiliyor. Fon kontratı bu kontrata doğrudan değil `IInvestorRegistry` arayüzü üzerinden bağlı; ileride farklı bir kimlik/uyum çözümüne geçilirse sadece registry değişir.

**FundToken:** Fon payını temsil eden ERC-20.

- `subscribe(amount)`: yatırımcı mUSDC yatırır, güncel NAV'a göre pay basılır (`shares = amount * 1e18 / nav`).
- `redeem(shares)`: paylar yakılır, `shares * nav / 1e18` kadar mUSDC ödenir.
- `setNav(newNav)`: sadece yönetici. NAV, 1 payın mUSDC cinsinden fiyatı, 1.00 ile başlıyor.
- `previewSubscribe` / `previewRedeem`: arayüzde "şu kadar pay alırsınız" göstermek için. Hesap tek yerde, kontratta duruyor.

Transfer kısıtını ERC-20'nin `_update` fonksiyonunda uyguluyorum. Mint, transfer ve burn hepsi buradan geçtiği için gönderenin ve alıcının onaylı olup olmadığını tek noktada kontrol etmek yetiyor.

Roller: deploy eden adres admin, demo yönetici cüzdanı ise sadece `MANAGER_ROLE` alıyor. Yani demo cüzdanıyla NAV güncellenip yatırımcı onaylanabiliyor ama roller değiştirilemiyor.

## Varsayımlar

- İşlemler anında ve güncel NAV üzerinden gerçekleşiyor. Gerçek fonlarda emirler bir sonraki NAV ile gerçekleşir (ileri fiyatlama); bunu POC için gereksiz karmaşık buldum.
- NAV'ı yönetici elle giriyor. Oracle ya da değişim limiti yok, sadece 0 olamaz.
- Yatırılan mUSDC kontratta duruyor ve çıkışlar buradan ödeniyor. NAV artıp kasada yeterli para kalmazsa çıkış hata veriyor; yönetici kasaya mUSDC ekleyebiliyor.
- Onayı kaldırılan yatırımcının payları cüzdanında kalıyor ama donuyor: transfer edemiyor, çıkış da yapamıyor.
- Hesaplamalarda yuvarlama aşağı, yani fon lehine.
- Giriş/çıkış/yönetim ücreti yok.
- ERC-3643 bu tarz izinli tokenlar için standart ama POC için ağır buldum. ERC-4626 da fiyatı kasadaki varlıktan hesapladığı için elle girilen NAV modeline uymuyor. O yüzden sade bir ERC-20 + onay listesi ile gittim.

## Backend

Backend'in işi zincirdeki event'leri (giriş, çıkış, NAV güncellemesi, yatırımcı onayı/kaldırılması ve yatırımcılar arası transferler) okuyup SQLite'a yazmak ve bunları API üzerinden sunmak. Özel anahtar tutmuyor.

- `chain.py`: zincirden event okuma
- `store.py`: SQLite işlemleri
- `indexer.py`: yeni blokları periyodik olarak tarama
- `api.py`: FastAPI endpoint'leri (`/health`, `/nav-history`, `/transactions`)

Indexer son birkaç bloğu işlemeden bekliyor (reorg ihtimaline karşı), kaldığı bloğu DB'de tutuyor ve aynı event'i iki kere yazmıyor. DB silinse bile deploy bloğundan tekrar oluşturulabildiği için ayrıca yedeklemeye gerek yok.

## Frontend

Tek sayfa, iki sekme:

- Yatırımcı: NAV, pay bakiyesi, mUSDC bakiyesi ve onay durumu; test USDC alma, giriş (önce approve, sonra subscribe), çıkış, transfer ve işlem geçmişi.
- Yönetici: NAV güncelleme, yatırımcı onaylama/kaldırma ve fon özeti. Bu sekme sadece `MANAGER_ROLE` sahibi cüzdanda görünüyor.

İşlem durumları (cüzdan onayı bekleniyor, gönderildi, başarılı, hata) tek bir hook üzerinden yönetiliyor; kontrat hataları kullanıcıya Türkçe mesaj olarak gösteriliyor.

## Test

- Kontratlar için Foundry testleri: giriş/çıkış hesapları, NAV yetkisi, onaysız adreslerin engellenmesi, likidite yetersizliği ve bir fuzz testi (aynı NAV'da giriş-çıkış yapan kimse yatırdığından fazlasını alamamalı).
- Backend için pytest; zincir kısmı sahte bir reader ile test ediliyor.
- Frontend için şimdilik otomatik test yok.

## Deploy ve demo

Kontratlar tek bir `forge script` ile Sepolia'ya deploy edilip Etherscan'de verify ediliyor. Script, Sepolia ve lokal zincir dışında çalışmıyor. Adresler `deployments/` altına yazılıyor.

Değerlendirme için üç demo cüzdanı hazırlanacak: bir yönetici, bir onaylı yatırımcı ve onay akışını denemek için bir onaysız yatırımcı. Hepsinde test ETH ve mUSDC olacak. Private key'ler repoda değil, teslim e-postasında paylaşılacak.

Lokal geliştirme için `docker compose up` ile anvil, kontrat deploy'u, backend ve frontend birlikte ayağa kalkıyor. GitHub Actions'ta her push'ta kontrat testleri, backend testleri ve frontend build çalışıyor.

## Sonraya kalanlar

- İleri fiyatlama / emir kuyruğu
- Ücretler
- Otomatik NAV (oracle)
- Gerçek KYC entegrasyonu
- Zorla transfer, pause, upgrade edilebilir kontratlar
- Frontend testleri
