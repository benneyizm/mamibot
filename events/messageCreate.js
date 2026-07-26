import { Events } from 'discord.js';
import { otomatikModKontrol } from '../utils/moderation.js';

export const name = Events.MessageCreate;

export async function execute(message) {
  try {
    await otomatikModKontrol(message);
  } catch (hata) {
    console.error('[OTOMATİK MOD HATASI]', hata);
  }
}
