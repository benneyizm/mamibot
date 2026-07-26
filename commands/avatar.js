import { SlashCommandBuilder } from 'discord.js';
import { bilgiEmbed } from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('avatar')
  .setDescription('Bir kullanıcının profil fotoğrafını gösterir.')
  .addUserOption((secenek) =>
    secenek
      .setName('kullanıcı')
      .setDescription('Avatarını görmek istediğin kullanıcı')
      .setRequired(false)
  );

export async function execute(interaction) {
  const hedef = interaction.options.getUser('kullanıcı') || interaction.user;

  const avatarUrl = hedef.displayAvatarURL({
    size: 1024,
    forceStatic: false
  });

  const embed = bilgiEmbed(
    `🖼️ ${hedef.username} adlı kullanıcının avatarı`,
    ''
  )
  .setImage(avatarUrl);

  await interaction.reply({
    embeds: [embed]
  });
}