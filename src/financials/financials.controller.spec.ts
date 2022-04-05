import { Test, TestingModule } from '@nestjs/testing';
import { FinancialsController } from './financials.controller';
import { FinancialsService } from './financials.service';

describe('FinancialsController', () => {
  let controller: FinancialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancialsController],
      providers: [FinancialsService],
    }).compile();

    controller = module.get<FinancialsController>(FinancialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
