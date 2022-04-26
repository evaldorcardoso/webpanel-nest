import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ItemsInventoryService } from './items-inventory.service';
import { CreateItemsInventoryDto } from './dto/create-items-inventory.dto';
import { UpdateItemsInventoryDto } from './dto/update-items-inventory.dto';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { ReturnItemsInventoryDto } from './dto/return-items-inventory.dto';
import { ReturnItemInventoryDto } from './dto/return-item-inventory.dto';
import { Role } from 'src/auth/role.decorator';
import { UserRole } from 'src/users/user-roles.enum';
import { FindItemsInventoryQueryDto } from './dto/find-items-inventory-query.dto';

@ApiTags('Items Inventory')
@Controller('items-inventory')
@UseGuards(AuthGuard(), RolesGuard)
export class ItemsInventoryController {
  constructor(private readonly itemsInventoryService: ItemsInventoryService) {}

  @Post('/company/:company')
  @Role(UserRole.ADMIN)
  async create(
    @Param('company') company: string,
    @Body() createItemsInventoryDto: CreateItemsInventoryDto[],
  ): Promise<ReturnItemInventoryDto[]> {
    const returnItemsInventoryDto: ReturnItemInventoryDto[] = [];
    const itemsInventory = await this.itemsInventoryService.create(
      company,
      createItemsInventoryDto,
    );
    itemsInventory.forEach((item) => {
      returnItemsInventoryDto.push(new ReturnItemInventoryDto(item));
    });
    return returnItemsInventoryDto;
  }

  @Get(':uuid/company/:company')
  async findOne(
    @Param('uuid') uuid: string,
    @Param('company') company: string,
  ): Promise<ReturnItemInventoryDto> {
    return new ReturnItemInventoryDto(
      await this.itemsInventoryService.findOne(uuid, company),
    );
  }

  @Get('/company/:company')
  @Role(UserRole.ADMIN)
  async findAll(
    @Query() query: FindItemsInventoryQueryDto,
    @Param('company') company: string,
  ): Promise<ReturnItemsInventoryDto> {
    const found = await this.itemsInventoryService.findAll(query, company);
    return {
      itemsInventory: found.itemsInventory,
      total: found.total,
    };
  }

  @Patch(':uuid/company/:company')
  @Role(UserRole.ADMIN)
  async update(
    @Param('uuid') uuid: string,
    @Param('company') company: string,
    @Body() updateItemsInventoryDto: UpdateItemsInventoryDto,
  ): Promise<ReturnItemInventoryDto> {
    return new ReturnItemInventoryDto(
      await this.itemsInventoryService.update(
        uuid,
        company,
        updateItemsInventoryDto,
      ),
    );
  }

  @Delete(':uuid/company/:company')
  async remove(@Param('uuid') uuid: string, @Param('company') company: string) {
    return await this.itemsInventoryService.remove(uuid, company);
  }
}
