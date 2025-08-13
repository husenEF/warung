import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('decimal')
  price: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  imageKey: string; // R2 object key for deletion/management

  @Column({ nullable: true })
  imagePath: string;
}
