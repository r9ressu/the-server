
const { Collection } = require('discord.js');

// Map to cache server invites: guildId -> Collection(inviteCode, uses)
const guildInvites = new Collection();

module.exports = (client) => {
    // 1. Cache current invites when the bot logs in
    client.on('ready', async () => {
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                const invites = await guild.invites.fetch();
                const codeUses = new Collection();
                invites.forEach((inv) => codeUses.set(inv.code, inv.uses));
                guildInvites.set(guild.id, codeUses);
            } catch (err) {
                console.log(`Could not fetch invites for guild ${guild.name}:`, err.message);
            }
        }
        console.log('Invite Tracker cache ready!');
    });

    // 2. Track new members joining
    client.on('guildMemberAdd', async (member) => {
        const cachedInvites = guildInvites.get(member.guild.id);
        
        try {
            const newInvites = await member.guild.invites.fetch();
            
            // Find which invite increased in uses
            const usedInvite = newInvites.find((inv) => cachedInvites?.get(inv.code) < inv.uses);
            
            // Update cache
            const codeUses = new Collection();
            newInvites.forEach((inv) => codeUses.set(inv.code, inv.uses));
            guildInvites.set(member.guild.id, codeUses);

            // Optional: Send invite message in a system channel
            const logChannel = member.guild.systemChannel; 
            if (usedInvite && logChannel) {
                const inviter = usedInvite.inviter;
                logChannel.send(
                    `Welcome ${member.user}! Joined using code **${usedInvite.code}** created by **${inviter ? inviter.tag : 'Unknown'}** (${usedInvite.uses} uses).`
                );
            }
        } catch (err) {
            console.error('Error tracking invite:', err);
        }
    });

    // 3. Update cache when new invites are created
    client.on('inviteCreate', async (invite) => {
        const cached = guildInvites.get(invite.guild.id) || new Collection();
        cached.set(invite.code, invite.uses);
        guildInvites.set(invite.guild.id, cached);
    });

    // 4. Update cache when invites are deleted
    client.on('inviteDelete', async (invite) => {
        const cached = guildInvites.get(invite.guild.id);
        if (cached) cached.delete(invite.code);
    });
};
