
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type DraftStatus =
  | 'AWAITING_CARD_SCAN'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED';

@Entity()
export class PaymentDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  terminalId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column({ nullable: true })
  cardToken?: string;

  @Column({ default: 'AWAITING_CARD_SCAN' })
  status: DraftStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}