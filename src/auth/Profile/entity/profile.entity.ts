import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../../users/entities/user.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, type: 'varchar' })
  firstName: string | null;

  @Column({ nullable: true, type: 'varchar' })
  lastName: string | null;

  @Column({ nullable: true, type: 'varchar' })
  telephone: string | null;

  @Column({ nullable: true, type: 'varchar' })
  address: string | null;

  @Column({ nullable: true, type: 'varchar' })
  city: string | null;

  @Column({ nullable: true, type: 'varchar' })
  state: string | null;

  @Column({ nullable: true, type: 'varchar' })
  postalCode: string | null;

  @Column({ nullable: true, type: 'varchar' })
  country: string | null;

  @Column({ nullable: true, type: 'varchar' })
  photoUrl: string | null;

  @Column({ nullable: true, type: 'varchar' })
  photoFilename: string | null;

  @Column({ nullable: true, type: 'uuid' })
  userId: string | null;

  @OneToOne(() => User, user => user.profile, {
    onDelete: 'CASCADE',
    nullable: true
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;
}