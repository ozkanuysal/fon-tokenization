# Fon Tokenizasyonu POC

Bir yatırım fonunun paylarını Sepolia testnet üzerinde token olarak temsil eden, uçtan uca çalışan bir proof of concept. Yatırımcı test stablecoin'i (mUSDC) ile fona girip pay alıyor, payını bozdurup fondan çıkıyor; yönetici NAV'ı güncelliyor ve yatırımcıları onaylıyor. Paylar yalnızca onaylı adresler arasında dolaşabiliyor.

- Canlı uygulama: https://fon-tokenization.vercel.app
- Backend API: https://fund-indexer.onrender.com/docs
- Ağ: Sepolia (chain id 11155111)

| Kontrat | Adres |
|---|---|
| FundToken (DFS, fon payı) | [`0x2e47C6787113D3aEb06B56A1fbC68Ef608b26CeA`](https://sepolia.etherscan.io/address/0x2e47C6787113D3aEb06B56A1fbC68Ef608b26CeA#code) |
| InvestorRegistry | [`0x3dc5f9f4e47be65ECEf304e831413974cd28d8e2`](https://sepolia.etherscan.io/address/0x3dc5f9f4e47be65ECEf304e831413974cd28d8e2#code) |
| MockUSDC (mUSDC) | [`0x3CC929067aEF3aD92E1827CadE3756A0C8502d8D`](https://sepolia.etherscan.io/address/0x3CC929067aEF3aD92E1827CadE3756A0C8502d8D#code) |

Üç kontrat da Etherscan'de verify edildi.

## Mimari genel bakış ve katmanların sorumlulukları

```
Tarayıcı (React, Vercel)
  |-- okuma  --> Sepolia RPC --> kontratlar
  |-- yazma  --> MetaMask    --> kontratlar
  '-- geçmiş --> Backend API (FastAPI, Render)
                    '-- indexer: kontrat event'leri --> SQLite
```

Fonun asıl durumu kontratlarda; diğer katmanlar ya zinciri okuyor ya da kullanıcının cüzdanıyla zincire yazıyor.

### Kontratlar

`contracts/` klasöründe; Solidity, Foundry ve OpenZeppelin v5.

- `FundToken`: fon payını temsil eden ERC-20. `subscribe` mUSDC alıp güncel NAV'a göre pay basıyor, `redeem` payı yakıp NAV'a göre mUSDC ödüyor, `setNav` ile yönetici fiyatı güncelliyor. Onaylı yatırımcı kontrolü ERC-20'nin `_update` fonksiyonunda. Mint, transfer ve burn hepsi oradan geçtiği için tek kontrol noktası yetiyor.
- `InvestorRegistry`: onaylı yatırımcı listesi. `FundToken` bu kontrata `IInvestorRegistry` arayüzü üzerinden bağlı; liste mantığı değişirse fon kontratına dokunmak gerekmiyor.
- `MockUSDC`: ödeme için kullanılan 6 ondalıklı test tokenı. Demo kolaylığı için herkes mint edebiliyor.
- Roller: deploy eden adres `DEFAULT_ADMIN_ROLE` (rolleri yönetir), yönetici `MANAGER_ROLE` (NAV ve yatırımcı onayı).

### Frontend

`web/` klasöründe; Vite, React, TypeScript ve wagmi/viem.

- Kontratları doğrudan okuyor, yazma işlemlerini kullanıcının cüzdanıyla yapıyor.
- Her işlem göndermeden önce simüle ediliyor. İşlem başarısız olacaksa kullanıcı cüzdan açılmadan Türkçe bir hata görüyor, örneğin "Bu adres onaylı yatırımcı değil."
- İşlem durumları tek bir hook'tan geliyor: cüzdanda onay bekleniyor, gönderildi (Etherscan linkiyle), başarılı, hata.
- Yönetici sekmesi sadece `MANAGER_ROLE` sahibi cüzdanda görünüyor.

### Backend

`backend/` klasöründe; Python ve FastAPI.

- Sadece okuyor: kontrat event'lerini (giriş, çıkış, NAV, yatırımcı onayı, transfer) SQLite'a yazıyor, geçmişi `/transactions` ve `/nav-history` üzerinden veriyor. Private key tutmuyor.
- Kaynak her zaman zincir. Son 3 blok onaylanmadan işlenmiyor (reorg ihtimali), kaldığı bloğu hatırlıyor ve aynı event'i iki kere yazmıyor. DB silinirse deploy bloğundan tekrar oluşuyor.
- Backend kapalıysa sadece geçmiş panelleri etkileniyor; giriş, çıkış ve yönetici işlemleri çalışmaya devam ediyor.

### DevOps

- GitHub Actions: kontrat testleri, backend testleri ve lint, frontend lint ve build, Docker imajlarının build'i ve gitleaks ile secret taraması.
- `docker compose up` ile anvil, kontrat deploy'u, backend ve frontend lokalde tek komutla ayağa kalkıyor.
- Frontend Vercel'e, backend Render'a GitHub'dan otomatik deploy ediliyor; backend servisinin ayarları `render.yaml` dosyasında.

```
contracts/     kontratlar, testler ve deploy script'i
backend/       FastAPI servisi, indexer ve testleri
web/           React uygulaması
deployments/   ağ bazında kontrat adresleri
scripts/       ABI'leri Foundry çıktısından backend ve frontend'e kopyalayan script
```

## Varsayımlar ve gerekçeleri

- Test ağı olarak Sepolia'yı seçtim. Gerçek para kullanılmıyor, MetaMask'te hazır geliyor ve kontrat kodunu Etherscan'de doğrulamak kolay.
- Fona ödeme, test amaçlı bir dolar tokenıyla (mUSDC) yapılıyor. Gerçek fonlarda para ya da stablecoin kullanılır; ETH gibi fiyatı oynayan bir varlık hesabı karıştırırdı.
- Fona giriş ve çıkış anında, o anki birim fiyattan (NAV) yapılıyor. Gerçek fonlarda emirler gün sonunda açıklanan fiyatla gerçekleşir; bu kuyruk yapısını POC için gereksiz buldum.
- Birim fiyatı (NAV) yönetici elle giriyor. Tek kural fiyatın sıfır olamaması.
- Yatırımcıların yatırdığı para fon kontratında duruyor ve çıkışlar oradan ödeniyor. Fiyat artıp kasa yetmezse çıkış hata veriyor, yönetici kasaya para ekleyebiliyor.
- Onayı kaldırılan yatırımcının payı cüzdanında kalıyor ama donuyor: ne transfer edebiliyor ne de çıkış yapabiliyor.
- Hesaplamalarda küsuratlar aşağı yuvarlanıyor. Böylece fon hiçbir zaman fazla pay vermiyor ya da fazla ödeme yapmıyor; bu otomatik testlerle de kontrol ediliyor.
- İzinli tokenlar için sektörde daha kapsamlı standartlar var (örneğin ERC-3643). Bu POC için ağır bulduğum için sade bir token ve onaylı yatırımcı listesi kullandım. Liste ayrı bir kontratta olduğu için ileride değiştirilebilir.
- Backend zorunlu değil, işlem ve NAV geçmişini hızlı göstermek için var. Zincirdeki kayıtları okuyup veritabanına yazıyor; özel anahtar tutmadığı ve zincire yazmadığı için risk taşımıyor.
- Değerlendiriciler için hazır demo cüzdanları hazırladım. İçlerinde test ETH'si ve test doları var; anahtarlar repoda değil, teslim e-postasında.
- Ücretsiz hosting kullandım: arayüz Vercel'de, backend Render'da. Render'ın ücretsiz planında servis bir süre kullanılmazsa uyuyor; ilk açılışta geçmiş paneli bir dakika kadar gecikebilir.

## Bilinçli olarak yapmadıklarım

- Gerçek fonlardaki gibi gün sonu fiyatıyla çalışan emir kuyruğu
- Giriş, çıkış ve yönetim ücretleri
- NAV'ın dış bir kaynaktan otomatik gelmesi; şu an yönetici giriyor
- Gerçek kimlik doğrulaması (KYC); onay sadece bir adres listesi
- Kapsamlı izinli token standardı (ERC-3643)
- Yöneticinin payları zorla geri alabilmesi ve kaybolan cüzdanı kurtarma
- Acil durumda sistemi durdurma ve kontratı sonradan güncelleyebilme
- Birden fazla fon
- Arayüz için otomatik testler; arayüzü tarayıcıda uçtan uca deneyerek kontrol ettim
- Mobil cüzdan desteği; şu an sadece tarayıcı eklentisi (MetaMask vb.) destekleniyor
- Backend için kullanıcı girişi; zaten herkese açık bilgiyi gösteriyor

## Production'a çıkmak için eksikler

### Güvenlik

- Bağımsız audit
- Admin ve yönetici rolleri için multisig (örneğin Safe) ve kritik işlemlerde timelock
- Rol ayrımı: yatırımcı onayını uyum ekibi, NAV'ı fon muhasebesi yapmalı; tek bir `MANAGER_ROLE` yeterli değil
- NAV güncellemelerinde değişim sınırı ve bayat NAV kontrolü, olağanüstü durumlar için pause
- Anahtar yönetimi: deploy ve operasyon anahtarları KMS/HSM'de
- Upgrade veya migration stratejisi

### Regülasyon

- SPK ve MKK fon mevzuatına ve kripto varlık düzenlemelerine uyum, payların kaydı ve saklaması
- KYC/AML (MASAK) süreçleri; onay listesinin gerçek kimlik doğrulamasına bağlanması
- KVKK: kişisel veri zincire yazılmamalı. Zincirde sadece adres olmalı, kimlik bilgisi off-chain tutulmalı.
- Yatırımcı uygunluğu (nitelikli yatırımcı vb.), ülke kısıtları ve transfer limitleri
- Gerçek varlık saklama (custody) ile stablecoin veya fiat ödeme altyapısı

### Operasyon

- Günlük NAV yayın süreci ve cut-off saatleri
- Zincirdeki kayıtlar ile fon muhasebesi arasında mutabakat
- İzleme ve alarm: indexer gecikmesi, RPC hataları, başarısız işlemler
- Yedekli RPC sağlayıcıları ve finality'ye göre indeksleme
- Olay müdahale runbook'ları, yedekleme ve felaket kurtarma
- Uyumayan, ücretli hosting

## Lokal kurulum ve testler

Gerekenler: [Foundry](https://getfoundry.sh), [uv](https://docs.astral.sh/uv/), Node 24 + pnpm, Docker (sadece compose için).

```bash
git clone --recurse-submodules https://github.com/ozkanuysal/fon-tokenization.git
cd fon-tokenization
make test
```

- Kontratlar: `cd contracts && forge test` ile 30 test, 1000 çalıştırmalı bir fuzz testi dahil. `forge coverage` üç kontratta satır, branch ve fonksiyon bazında %100.
- Backend: `cd backend && uv run pytest` ile 23 test, lint için `uv run ruff check .`
- Frontend: `cd web && pnpm install && pnpm lint && pnpm build`

Tüm sistemi lokalde çalıştırmak için:

```bash
make up    # docker compose up --build
```

- Arayüz http://localhost:5173, backend http://localhost:8000/docs, anvil http://localhost:8545
- MetaMask'e Anvil ağını (chain id 31337, RPC http://127.0.0.1:8545) ekleyip anvil'in 1, 2 ve 3 numaralı test hesaplarını import edin: 1 yönetici, 2 onaylı yatırımcı, 3 onaysız yatırımcı. Anahtarlar anvil'in herkesçe bilinen test anahtarları, `docker compose logs anvil` çıktısında listeleniyor.

Sepolia'ya deploy:

```bash
cp contracts/.env.example contracts/.env   # RPC URL, Etherscan key, deployer key ve demo adresleri
make deploy-sepolia
```

Adresler `deployments/sepolia.json` dosyasına yazılıyor. Kontrat arayüzü değişirse `make abi` ile ABI'ler backend ve frontend'e kopyalanıyor.

## Uygulamayı nasıl deneyebilirsiniz

Teslim e-postasında üç demo cüzdanının private key'leri var. Hepsinde Sepolia test ETH'si ve 10.000 mUSDC yüklü:

| Cüzdan | Adres | Durum |
|---|---|---|
| Yönetici | `0x62c6ad5AD5351A01F617F65444006dCd5CFdbcD0` | `MANAGER_ROLE` |
| Yatırımcı A | `0x2F2eB48aEBb16E001A05dB916979a4D81c18E85e` | onaylı |
| Yatırımcı B | `0xeb08AD3a3Dc1f5F1cd070A065b105c68fA338DA9` | onaysız |

Cüzdanları MetaMask'e import edip https://fon-tokenization.vercel.app adresinde "Cüzdan bağla"ya basın. Cüzdan başka bir ağdaysa uygulama Sepolia'ya geçmeyi öneriyor.

Önerdiğim senaryo:

1. Yatırımcı B ile 100 mUSDC'lik giriş deneyin. Önce harcama izni veriliyor, ardından arayüz "Bu adres onaylı yatırımcı değil." diyor ve giriş butonu kapalı kalıyor.
2. Yönetici cüzdanına geçip Yönetici sekmesinde B'nin adresini onaylayın.
3. B ile girişi tamamlayın; pay bakiyesi ve değeri güncelleniyor.
4. Yöneticiyle NAV'ı 1,10 yapın. Fon özeti kasanın yetmediğini söylerse "Kasaya 10.000 test mUSDC ekle" ile likidite ekleyin.
5. B ile payların bir kısmını bozdurun; ödeme yeni NAV'dan yapılıyor.
6. Yatırımcı A ile onaysız bir adrese (örneğin `0x000000000000000000000000000000000000dEaD`) pay transferi deneyin; arayüz reddediyor.
7. İşlem geçmişi ve NAV geçmişi bir dakika içinde backend'den geliyor.

Kendi cüzdanınızla denemek isterseniz yönetici cüzdanıyla adresinizi onaylayın ve "10.000 test mUSDC al" ile test parası alın. Gas için Sepolia ETH gerekiyor; bir faucet'ten ya da demo cüzdanlarından gönderebilirsiniz.
