import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbYolu = path.join(__dirname, 'muhammed.db');

export const db = new Database(dbYolu);
db.pragma('journal_mode = WAL');

// Sohbet geçmişi: /konuş komutunun kullanıcıyı "hatırlaması" için kullanılır
db.exec(`
  CREATE TABLE IF NOT EXISTS sohbet_gecmisi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kullanici_id TEXT NOT NULL,
    kanal_id TEXT NOT NULL,
    mesaj TEXT NOT NULL,
    cevap TEXT NOT NULL,
    tarih INTEGER NOT NULL
  );
`);

// Kullanıcı bazlı basit durum takibi (son konu, kaçıncı mesaj vs.)
db.exec(`
  CREATE TABLE IF NOT EXISTS kullanici_durumu (
    kullanici_id TEXT PRIMARY KEY,
    son_kategori TEXT,
    mesaj_sayaci INTEGER DEFAULT 0,
    son_etkilesim INTEGER
  );
`);

// Moderasyon logları (uyarı/ban/kick/timeout geçmişi)
db.exec(`
  CREATE TABLE IF NOT EXISTS mod_loglari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sunucu_id TEXT NOT NULL,
    hedef_id TEXT NOT NULL,
    yetkili_id TEXT NOT NULL,
    islem TEXT NOT NULL,
    sebep TEXT,
    tarih INTEGER NOT NULL
  );
`);

// Sunucu bazlı otomatik moderasyon ayarları (küfür/davet/link/spam engeli aç-kapat)
db.exec(`
  CREATE TABLE IF NOT EXISTS sunucu_ayarlari (
    sunucu_id TEXT PRIMARY KEY,
    kufur_engeli INTEGER NOT NULL DEFAULT 1,
    davet_engeli INTEGER NOT NULL DEFAULT 1,
    link_engeli INTEGER NOT NULL DEFAULT 1,
    spam_engeli INTEGER NOT NULL DEFAULT 1
  );
`);

const GECERLI_AYAR_ALANLARI = new Set(['kufur_engeli', 'davet_engeli', 'link_engeli', 'spam_engeli']);

/** Sunucunun otomatik moderasyon ayarlarını getirir, yoksa varsayılan (hepsi açık) satırı oluşturur. */
export function sunucuAyarlariGetir(sunucuId) {
  let satir = db.prepare(`SELECT * FROM sunucu_ayarlari WHERE sunucu_id = ?`).get(sunucuId);
  if (!satir) {
    db.prepare(`INSERT INTO sunucu_ayarlari (sunucu_id) VALUES (?)`).run(sunucuId);
    satir = db.prepare(`SELECT * FROM sunucu_ayarlari WHERE sunucu_id = ?`).get(sunucuId);
  }
  return satir;
}

/** Sunucunun otomatik moderasyon ayarlarından birini günceller (aç/kapat). */
export function sunucuAyariGuncelle(sunucuId, alan, deger) {
  if (!GECERLI_AYAR_ALANLARI.has(alan)) {
    throw new Error(`Geçersiz ayar alanı: ${alan}`);
  }
  sunucuAyarlariGetir(sunucuId); // satırın var olduğundan emin ol
  db.prepare(`UPDATE sunucu_ayarlari SET ${alan} = ? WHERE sunucu_id = ?`).run(deger ? 1 : 0, sunucuId);
}

/** Son konuşma kaydını ekler ve kullanıcı başına en fazla 5 kayıt tutar. */
export function sohbetKaydet(kullaniciId, kanalId, mesaj, cevap) {
  db.prepare(
    `INSERT INTO sohbet_gecmisi (kullanici_id, kanal_id, mesaj, cevap, tarih) VALUES (?, ?, ?, ?, ?)`
  ).run(kullaniciId, kanalId, mesaj, cevap, Date.now());

  const fazlalar = db
    .prepare(
      `SELECT id FROM sohbet_gecmisi WHERE kullanici_id = ? ORDER BY id DESC LIMIT -1 OFFSET 5`
    )
    .all(kullaniciId);

  if (fazlalar.length > 0) {
    const idler = fazlalar.map((r) => r.id);
    db.prepare(`DELETE FROM sohbet_gecmisi WHERE id IN (${idler.map(() => '?').join(',')})`).run(
      ...idler
    );
  }
}

/** Kullanıcının son mesajını getirir (varsa). */
export function sonMesajiGetir(kullaniciId) {
  return db
    .prepare(`SELECT * FROM sohbet_gecmisi WHERE kullanici_id = ? ORDER BY id DESC LIMIT 1`)
    .get(kullaniciId);
}

/** Kullanıcı durumunu okur, yoksa oluşturur. */
export function kullaniciDurumuGetir(kullaniciId) {
  let satir = db.prepare(`SELECT * FROM kullanici_durumu WHERE kullanici_id = ?`).get(kullaniciId);
  if (!satir) {
    db.prepare(
      `INSERT INTO kullanici_durumu (kullanici_id, son_kategori, mesaj_sayaci, son_etkilesim) VALUES (?, NULL, 0, ?)`
    ).run(kullaniciId, Date.now());
    satir = db.prepare(`SELECT * FROM kullanici_durumu WHERE kullanici_id = ?`).get(kullaniciId);
  }
  return satir;
}

/** Kullanıcı durumunu günceller. */
export function kullaniciDurumuGuncelle(kullaniciId, kategori) {
  kullaniciDurumuGetir(kullaniciId); // satırın var olduğundan emin ol
  db.prepare(
    `UPDATE kullanici_durumu SET son_kategori = ?, mesaj_sayaci = mesaj_sayaci + 1, son_etkilesim = ? WHERE kullanici_id = ?`
  ).run(kategori, Date.now(), kullaniciId);
}

/** Moderasyon işlemini loglar. */
export function modLogEkle(sunucuId, hedefId, yetkiliId, islem, sebep) {
  db.prepare(
    `INSERT INTO mod_loglari (sunucu_id, hedef_id, yetkili_id, islem, sebep, tarih) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(sunucuId, hedefId, yetkiliId, islem, sebep || 'Belirtilmedi', Date.now());
}
