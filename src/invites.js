const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('Check total invites for a user')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('The user whose invites you want to check')
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;

        try {
            const invites = await interaction.guild.invites.fetch();
            
            // Filter invites created by the target user and sum the uses
            const userInvites = invites.filter((inv) => inv.inviter && inv.inviter.id === targetUser.id);
            const totalUses = userInvites.reduce((acc, inv) => acc + inv.uses, 0);

            const embed = new EmbedBuilder()
                .setTitle(`📊 Invite Stats for ${targetUser.username}`)
                .setColor('#5865F2')
                .setDescription(`**${targetUser.username}** currently has **${totalUses}** invite(s).`)
                .setThumbnail(targetUser.displayAvatarURL());

            await interaction.reply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.reply({
                content: 'Failed to fetch invite stats. Make sure I have the `Manage Guild` permission!',
                ephemeral: true
            });
        }
    }
};
