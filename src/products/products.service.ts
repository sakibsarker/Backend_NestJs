import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { User } from 'src/users/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createProduct(
    name: string,
    qty: number,
    desc: string,
    price: number,
    user: User, // Pass the user who is creating the product
  ): Promise<Product> {
    // Ensure all required fields are provided
    if (!name || !qty || !desc || !price || !user) {
      throw new Error('Missing required fields for creating a product');
    }

    // Create and save the product
    const product = this.productRepository.create({
      name,
      qty,
      desc,
      price,
      createdBy: user,
    });

    return this.productRepository.save(product);
  }
  async getAllProducts(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async getProductById(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async updateProduct(
    id: number,
    updateData: Partial<Product>,
  ): Promise<Product> {
    const product = await this.getProductById(id); // Ensure the product exists
    await this.productRepository.update(id, updateData);
    return this.productRepository.findOne({
      where: { id },
    }) as Promise<Product>;
  }

  async deleteProduct(id: number): Promise<void> {
    const product = await this.getProductById(id); // Ensure the product exists
    await this.productRepository.delete(id);
  }
}
