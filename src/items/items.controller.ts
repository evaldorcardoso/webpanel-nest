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
  ValidationPipe,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/role.decorator';
import { UserRole } from '../users/user-roles.enum';
import { ReturnItemDto } from './dto/return-item.dto';
import { ReturnFindItemsDto } from './dto/return-find-items.dto';
import { FindItemsQueryDto } from './dto/find-items-query.dto';

@ApiBearerAuth()
@ApiTags('Items')
@Controller('items')
@UseGuards(AuthGuard(), RolesGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @Role(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new item' })
  @ApiCreatedResponse({ type: ReturnItemDto })
  async create(@Body() createItemDto: CreateItemDto): Promise<ReturnItemDto> {
    return new ReturnItemDto(await this.itemsService.createItem(createItemDto));
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get an item by uuid' })
  @ApiOkResponse({ type: ReturnItemDto })
  async findOne(@Param('uuid') uuid): Promise<ReturnItemDto> {
    return new ReturnItemDto(await this.itemsService.findOne(uuid));
  }

  @Get()
  @ApiOperation({ summary: 'Find items by filter query' })
  @ApiOkResponse({ type: ReturnFindItemsDto })
  async findAll(
    @Query() query: FindItemsQueryDto,
  ): Promise<ReturnFindItemsDto> {
    const data = await this.itemsService.findAll(query);

    return new ReturnFindItemsDto(data);
  }

  @Patch(':uuid')
  @ApiOperation({ summary: 'Update the item data' })
  @ApiOkResponse({ type: ReturnItemDto })
  @Role(UserRole.ADMIN)
  async update(
    @Param('uuid') uuid: string,
    @Body(ValidationPipe) updateItemDto: UpdateItemDto,
  ): Promise<ReturnItemDto> {
    return new ReturnItemDto(
      await this.itemsService.update(uuid, updateItemDto),
    );
  }

  @Delete(':uuid')
  @ApiOperation({ summary: 'Delete an item' })
  @ApiOkResponse()
  @Role(UserRole.ADMIN)
  async remove(@Param('uuid') uuid: string) {
    await this.itemsService.remove(uuid);
  }
}
