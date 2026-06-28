import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboard(communityId: string) {
    this.logger.debug(`Loading dashboard for community ${communityId}`);

    const [pockets, recentTxns, contributions, members] = await Promise.all([
      this.prisma.pocket.findMany({ where: { communityId } }),
      this.prisma.transaction.findMany({
        where: { communityId },
        include: { member: { select: { id: true, name: true, avatarUrl: true } }, pocket: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.contribution.findMany({
        where: { communityId },
        include: { member: { select: { id: true, name: true, email: true, avatarUrl: true } }, schedule: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.membership.findMany({
        where: { communityId, status: 'active' },
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      }),
    ]);

    const totalBalance = pockets.reduce((sum, p) => sum + p.balance, BigInt(0));
    this.logger.debug(`Dashboard loaded: community=${communityId} pockets=${pockets.length} members=${members.length} totalBalance=${totalBalance}`);

    const pendingVerifications = contributions
      .filter(c => c.status === 'pending_verify')
      .map(c => ({
        id: c.id,
        member: {
          name: c.member.name || 'Unknown',
          avatar: c.member.name ? c.member.name[0].toUpperCase() : 'U',
          avatarUrl: c.member.avatarUrl || null,
          color: 'bg-primary/20 text-primary',
        },
        date: c.paidAt ? new Date(c.paidAt).toLocaleDateString() : new Date(c.createdAt).toLocaleDateString(),
        amount: Number(c.amount),
        pocket: c.schedule?.title || 'Iuran',
        pocketId: c.scheduleId || '',
      }));

    return {
      totalBalance: totalBalance.toString(),
      pockets: pockets.map(p => ({ ...p, balance: p.balance.toString() })),
      recentTransactions: recentTxns.map(t => ({ ...t, amount: t.amount.toString() })),
      contributions: contributions.map(c => ({ ...c, amount: c.amount.toString() })),
      pendingVerifications,
      members,
    };
  }
}
