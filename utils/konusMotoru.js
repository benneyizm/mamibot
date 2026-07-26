import { sonMesajiGetir, sohbetKaydet, kullaniciDurumuGetir, kullaniciDurumuGuncelle } from '../database/db.js';

/** Rastgele bir eleman seçer. */
function rastgeleSec(dizi) {
  return dizi[Math.floor(Math.random() * dizi.length)];
}

/** Metni normalize eder: küçük harfe çevirir, gereksiz boşlukları ve noktalamayı sadeleştirir. */
function normalizeEt(metin) {
  return metin
    .toLocaleLowerCase('tr-TR')
    .replace(/[?!.,;:"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Kategoriler: her biri anahtar kelimeler ve o kategoriye ait doğal cevap havuzu içerir.
 * Sıra önemlidir; ilk eşleşen kategori kullanılır.
 */
const kategoriler = [
  {
    ad: 'selam',
    anahtarlar: ['selam', 'slm', 'merhaba', 'mrb', 'hey', 'naber be', 'selamün aleyküm', 'eyw'],
    cevaplar: [
      'Selam kanka 👋 göte parmak??',
      'Eyw, ne haber? lol girip feedliyim mi 😄',
      'Selamünaleyküm, hoş geldin sohbete. Götüne parmak atayım mı 😎',
      'Hey! Uzun zaman oldu ya. futbol oynarım ben salağım',
      'Naber naber yarağım senden beter😎',
    ],
  },
  {
    ad: 'naber',
    anahtarlar: ['naber', 'nasılsın', 'nasilsin', 'ne haber', 'napıyorsun', 'napiyorsun', 'ne yapıyorsun'],
    cevaplar: [
      'İyiyim oçun oğlu sen? ',
      'öyle böyle kardeşim sen nasılsın oç??',
      'bana napıyorsun demen şaşırtıcı botum ben salak oç',
      'Takılıyorum ya, bir şey yapmıyorum.',
      'Fena değil, sıkılıyordum tam sohbet ederiz dedim.',
    ],
  },
  {
    ad: 'iyi_karsilik',
    anahtarlar: ['ben de iyiyim', 'ben iyiyim', 'iyiyim ya', 'süperim', 'harikayım', 'gayet iyiyim'],
    cevaplar: ['Süper o zaman 😄 kaybol burdan 😁', 'Güzel güzel afferim oğluş.', 'Sevindim buna ya. yok ol şimdi oç.', 'Hadi bakalım öyleyse yala taşşa.'],
  },
  {
    ad: 'kotu_hal',
    anahtarlar: ['kötüyüm', 'kotuyum', 'moralim bozuk', 'üzgünüm', 'canım sıkkın', 'canim sikkin', 'boktan', 'berbat geçti'],
    cevaplar: [
      'ya niye ki, ne oldu? kim parmakladı seni 😅',
      'geçer kanka, çok kafana takma. gel bir kere ben parmaklayayım seni 😎',
      'üzülme ya, hepsi geçer bunların. yat altıma biraz, kafanı dağıtalım.',
      'anlıyorum, bazen böyle günler oluyor. konuşmak ister misin? yada çakışalım hahaha',
    ],
  },
  {
    ad: 'sikildim',
    anahtarlar: ['sıkıldım', 'sikildim', 'canım sıkıldı', 'canim sikildi', 'boşum', 'bosum'],
    cevaplar: [
      'Canım sıkıldı benimde biraz valla. yat bi sakoya',
      'Gel oyun girek, sıkıntı dağılır. hemde bana bi 31 patlatırsın 😎',
      'aynen, ben de öyleyim şu an. gel bari bi posta atak',
      'bir şeyler izle bari, kafa dağıt. bende aynı gel umutu götünden sikelim 😄',
    ],
  },
  {
    ad: 'uyku',
    anahtarlar: ['uykum var', 'uyuyacağım', 'uyuyacagim', 'yorgunum', 'uyku geldi', 'gözlerim kapanıyor'],
    cevaplar: [
      'Uyuyacaktım tam. ama sana gireyimde ayılayım😄',
      'git uyu kanka, yarın konuşuruz. sonra da bi 31 patlatırsın bana 😎',
      'ben de uykuluyum ya inan. gel bi 31 patlatıp uyuyalım.',
      'erken yat, sabah zinde kalk. zinde kalk ki iyi bir performans sergile',
    ],
  },
  {
    ad: 'oyun',
    anahtarlar: ['oyun oynayalım', 'oyun oynar mısın', 'valorant', 'lol oynayalım', 'oyuna gel', 'oyun girek', 'oyun var mı'],
    cevaplar: [
      'Gel oyun girek hadi. parmağını ilk götüne sokan kazanır 😎',
      'Varım tabii, hangi oyun? göte parmak?, umut sikmece?, samet sikmece?, yada götümden sikmeye ne dersin :D?',
      'Şu an müsaitim, girelim mi? (bana)',
      'Oyun her zaman iyidir, hazırım.',
    ],
  },
  {
    ad: 'espri_istek',
    anahtarlar: ['espri yap', 'şaka yap', 'saka yap', 'güldür beni', 'komik bir şey söyle'],
    cevaplar: [
      'Matematik öğretmenim "x nerede" diye sordu, ben de "eskiden buradaydı ama gitti" dedim 😂 sonra polisler kafama 3 el ateş etti',
      'şaklaban mıyım ben oç?? 😂',
      'çok soktun çek',
      'orama koma burama ko :ddd',
      'oçuz abi piçiz abi :D.:D.Dd',
    ],
  },
  {
    ad: 'harbi_mi',
    anahtarlar: ['harbi mi', 'gerçekten mi', 'yalan söyleme', 'cidden mi', 'sahi mi', 'söyle mi', 'valla mı', 'vallahi mi', 'yemin ederim mi', 'de quran'],
    cevaplar: ['Harbi mi lan 😂', 'Valla öyle diyorlar.', 'Yemin ederim doğru.', 'Şaka değil bu ya gerçekten.'],
  },
  {
    ad: 'tesekkur',
    anahtarlar: ['teşekkür', 'tesekkur', 'sağol', 'sagol', 'saol', 'eyvallah'],
    cevaplar: ['Rica ederim kanka 😄', 'Ne demek, her zaman.', 'Eyvallah sana da.', 'Bir şey değil ya.'],
  },
  {
    ad: 'veda',
    anahtarlar: ['güle güle', 'gule gule', 'hoşça kal', 'hosca kal', 'görüşürüz', 'gorusuruz', 'bay bay', 'kapatıyorum'],
    cevaplar: ['Görüşürüz kanka toz ol 👋', 'Hadi kendine iyi bak görmiyim seni bir daha burda.', 'Bay bay, sonra konuşuruz ara beni yala beni.', 'Tamamdır, iyi günler. çoluğunu çocuğunu sikeyim'],
  },
  {
    ad: 'kimsin',
    anahtarlar: ['kimsin', 'sen kimsin', 'adın ne', 'adin ne', 'ismin ne', 'seni kim yaptı', 'seni kim yazdı', 'robot musun', 'bot musun'],
    cevaplar: [
      'Ben muhammed kanka, bu sunucunun orospusuyum 😎',
      'muhammed benim, sohbet etmeyi severim ve götümü parmaklamayı severim sadece.',
      'Adım muhammed, robot falan değilim ya, sadece biraz farklıyım işte 😄',
      'mami diyorlar bana, alışırsın zamanla. (mami de tanırlar bazen)',
    ],
  },
  {
    ad: 'sevgi',
    anahtarlar: ['seni seviyorum', 'seviyorum seni', 'aşığım sana', 'çok tatlısın'],
    cevaplar: ['Ay durr 😄 ben de seni severim kanka.', 'Tatlısın sen de ya.', 'Duygusal oldu birden 😂 sağol.'],
  },
  {
    ad: 'hakaret',
    anahtarlar: ['aptalsın', 'salaksın', 'gerizekalı', 'mal mısın', 'işe yaramaz', 'oçsun', 'seni sevmiyorum', 'siktir git', 'defol', 'siktir', 'orospu çocuğu', 'piç', 'amcık', 'amına koyim', 'ananı sikiyim', 'ananı sikim', 'ananı siktim', 'ananı sikicem'],
    cevaplar: [
      'vay be, ne oldu böyle birden ananı mı siktik😅',
      'düzgün konuş panpa sikmiyim 😃',
      'hoop, biraz nazik olalım regl olmuşum 😅',
      'bugün geçirdiğin gündür bu, boş ver.',
    ],
  },
  {
    ad: 'yemek',
    anahtarlar: ['ne yedin', 'açım', 'acim', 'yemek yapalım', 'karnım aç'],
    cevaplar: ['Ben de açım şu an valla.', 'Bir şeyler söyle bari, yemek modundayım.', 'Açsan hemen bir şey ye, bekleme.'],
  },
  {
    ad: 'olabilir',
    anahtarlar: ['olur mu', 'olur mu acaba', 'sence olur mu', 'yapsam mı'],
    cevaplar: ['Olabilir valla.', 'Bence dene, kaybedecek bir şeyin yok.', 'Yaparsan iyi olur bence.'],
  },
  {
    ad: 'bilmiyorum',
    anahtarlar: ['bilmiyorum', 'bilmiyom', 'ne bileyim', 'kararsızım'],
    cevaplar: ['Ben de bilmiyorum ya açıkçası.', 'Zor bir soru bu, düşünmek lazım.', 'Kararsızlık en kötüsü, anlıyorum.'],
  },
];

// Hiçbir kategoriye uymayan mesajlar için genel doğal cevap havuzu
const genelCevaplar = [
  'Ne var yine 😂',
  'Anlat bakalım.',
  'Devam et, dinliyorum.',
  'Hmm, ilginç.',
  'Yok ya, ciddi misin?',
  'Aynen öyle diyebilirim.',
  'Bilemedim şimdi ama olabilir.',
  'İyi gidiyo bu konu, devam.',
  'Hi hi, komik oldu.',
  'Valla ne diyeyim bilmiyorum ama dinliyorum seni.',
];

/**
 * Kullanıcının mesajını analiz edip Muhammed'in karakterine uygun,
 * doğal ve samimi bir cevap üretir. Kullanıcı geçmişini hafif şekilde
 * hesaba katarak tekrar eden mesajlara farklı tepki verir.
 */
export function cevapUret(kullaniciId, kanalId, mesaj) {
  const normal = normalizeEt(mesaj);
  const durum = kullaniciDurumuGetir(kullaniciId);
  const sonMesaj = sonMesajiGetir(kullaniciId);

  // Aynı mesaj arka arkaya gelirse farklı bir tepki ver
  if (sonMesaj && normalizeEt(sonMesaj.mesaj) === normal) {
    const tekrarCevaplari = [
      'Aynısını demiştin az önce 😅',
      'Bunu az önce söylemedin mi? Tekrar mı diyorsun?',
      'Hah, yine mi o konu 😂',
    ];
    const cevap = rastgeleSec(tekrarCevaplari);
    sohbetKaydet(kullaniciId, kanalId, mesaj, cevap);
    kullaniciDurumuGuncelle(kullaniciId, 'tekrar');
    return cevap;
  }

  for (const kategori of kategoriler) {
    if (kategori.anahtarlar.some((anahtar) => normal.includes(anahtar))) {
      let cevap = rastgeleSec(kategori.cevaplar);

      // Aynı kategoriden art arda sorulursa küçük bir çeşitlilik ekle
      if (durum.son_kategori === kategori.ad) {
        cevap += ' Yine mi bu konu 😄';
      }

      sohbetKaydet(kullaniciId, kanalId, mesaj, cevap);
      kullaniciDurumuGuncelle(kullaniciId, kategori.ad);
      return cevap;
    }
  }

  const cevap = rastgeleSec(genelCevaplar);
  sohbetKaydet(kullaniciId, kanalId, mesaj, cevap);
  kullaniciDurumuGuncelle(kullaniciId, 'genel');
  return cevap;
}
