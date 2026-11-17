/** Klinik / diyetisyen bilgileri: PDF başlığı, alt bilgi, mesaj şablonları ve KVKK metinlerinde kullanılır */
export interface Brand {
  clinic: string
  name: string
  phone: string
  web: string
  addr: string
  color: string
  foot: string
  link: string
  /** Logo (data URL) */
  logo: string
  tpl: string
  tpl2: string
  tpl3: string
}

export const DEFAULT_BRAND: Brand = {
  clinic: '', name: '', phone: '', web: '', addr: '', color: '#1f6b4f',
  foot: 'Günde en az 2 litre su içmeyi unutmayın.', link: '', logo: '',
  tpl: 'Merhaba {ad}, {tarih} saat {saat} için randevunuz var. {link}\nGörüşmek üzere. {klinik}',
  tpl2: 'Merhaba {ad}, sizi bir süredir göremedik. Beslenme planınızı birlikte gözden geçirmek için yeni bir randevu ayarlayalım mı? {klinik}',
  tpl3: 'Merhaba {ad}, beslenme programınız ekte. Sorularınız olursa yazabilirsiniz. {klinik}',
}

/** {ad} {tarih} {saat} {link} {klinik} yer tutucularını doldurur, fazla boşlukları toplar */
export function fillTemplate(t: string, v: { ad?: string; tarih?: string; saat?: string; link?: string; klinik?: string }): string {
  return t
    .replace(/\{ad\}/g, v.ad ?? '').replace(/\{tarih\}/g, v.tarih ?? '').replace(/\{saat\}/g, v.saat ?? '')
    .replace(/\{link\}/g, v.link ?? '').replace(/\{klinik\}/g, v.klinik ?? '')
    .replace(/[ \t]+\n/g, '\n').replace(/ {2,}/g, ' ').trim()
}

export const firstName = (full: string) => full.replace(/^Örnek – /, '').trim().split(/\s+/)[0] ?? ''

/** Telefon 11 haneli ve 0 ile başlıyorsa 90'lı uluslararası biçim, değilse null */
export function phoneIntl(tel: string): string | null {
  const t = tel.replace(/\D/g, '')
  return t.length === 11 && t[0] === '0' ? `90${t.slice(1)}` : null
}
export const waHref = (tel: string, msg: string) => {
  const p = phoneIntl(tel)
  return p ? `https://wa.me/${p}?text=${encodeURIComponent(msg)}` : null
}
export const smsHref = (tel: string, msg: string) => {
  const p = phoneIntl(tel)
  return p ? `sms:+${p}?body=${encodeURIComponent(msg)}` : null
}

const who = (b: Brand) => ({
  n: b.name.trim() || b.clinic.trim() || 'Diyetisyen',
  c: [b.phone, b.web, b.addr].map((x) => x.trim()).filter(Boolean).join(', ') || '……………………',
})

export function kvkkAydinlatma(b: Brand): string {
  const w = who(b)
  return `KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ

1. Veri sorumlusu
${w.n} (iletişim: ${w.c}) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusuyum.

2. İşlenen kişisel veriler
Kimlik ve iletişim bilgileriniz (ad soyad, telefon, e-posta); sağlık verileriniz (boy, kilo, vücut ölçüleri, hastalık, ilaç, alerji ve intolerans bilgileri, tahlil sonuçları); beslenme alışkanlıklarınız; randevu ve görüşme kayıtlarınız.

3. İşleme amaçları
Beslenme ve diyet danışmanlığı hizmetinin sunulması, size özel beslenme programının hazırlanması ve takibi, randevu planlaması ve hatırlatma, hizmetin kalitesinin sürdürülmesi ve yasal yükümlülüklerin yerine getirilmesi.

4. Hukuki sebep
Sağlık verileriniz özel nitelikli kişisel veri olduğundan açık rızanıza dayanılarak işlenir. Kimlik ve iletişim verileri sözleşmenin kurulması/ifası ve hukuki yükümlülük sebeplerine dayanabilir.

5. Aktarım
Verileriniz, yasal zorunluluklar dışında üçüncü kişilerle paylaşılmaz. Kayıtların tutulduğu bilgi sistemi hizmet sağlayıcıları verilere teknik olarak erişebilir. Yurt dışında bulunan sistemlerin kullanılması hâlinde ayrıca açık rızanız alınır.

6. Saklama süresi
Verileriniz, hizmet ilişkisi süresince ve ilgili mevzuatın öngördüğü süre boyunca saklanır, süre sonunda silinir, yok edilir veya anonim hâle getirilir.

7. Haklarınız (KVKK m.11)
Verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, amacına uygun kullanılıp kullanılmadığını öğrenme, düzeltilmesini veya silinmesini isteme, itiraz etme ve zarar hâlinde tazminat talep etme haklarına sahipsiniz. Başvurularınızı yukarıdaki iletişim bilgileri üzerinden iletebilirsiniz.

Not: Bu metin bir taslaktır. Kullanmadan önce bir hukuk danışmanıyla gözden geçirin ve kendi işleyişinize göre düzenleyin.`
}

export function kvkkRiza(b: Brand, clientName = ''): string {
  const w = who(b)
  const ad = clientName.replace(/^Örnek – /, '').trim() || '……………………'
  return `AÇIK RIZA BEYANI

Aydınlatma metnini okudum ve anladım. ${w.n} tarafından beslenme ve diyet danışmanlığı hizmetinin sunulması amacıyla, sağlık verilerim dâhil kişisel verilerimin aydınlatma metninde belirtilen kapsamda işlenmesine özgür irademle açık rıza veriyorum.

☐ Randevu hatırlatma ve takip mesajlarının telefonuma (SMS/WhatsApp) gönderilmesine izin veriyorum.
☐ Verilerimin yurt dışında bulunan bilgi sistemlerinde saklanmasına açık rıza veriyorum.

Açık rızamı dilediğim zaman geri çekebileceğimi biliyorum.

Ad soyad: ${ad}
Tarih: ……………………
İmza: ……………………

Not: Bu metin bir taslaktır. Kullanmadan önce bir hukuk danışmanıyla gözden geçirin.`
}