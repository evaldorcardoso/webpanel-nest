import { Test, TestingModule } from '@nestjs/testing';
import { Company } from 'src/companies/company.entity';
import { CompanyRepository } from 'src/companies/companies.repository';
import { Financial } from './financial.entity';
import { FinancialsService } from './financials.service';
import { FinancialRepository } from './financial.repository';
import { faker } from '@faker-js/faker';
import { CreateFinancialDto } from './dto/create-financial.dto';
import { UserRole } from 'src/users/user-roles.enum';
import { ReturnFindFinancialsDto } from './dto/return-find-financials.dto';
import { FindFinancialsQueryDto } from './dto/find-financials-query.dto';
import { DeleteResult } from 'typeorm';

describe('FinancialsService', () => {
  let service: FinancialsService;
  let financialRepository: FinancialRepository;
  let companyRepository: CompanyRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialsService,
        {
          provide: FinancialRepository,
          useValue: {
            findOne: jest.fn(),
            createFinancial: jest.fn(),
            findFinancials: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: CompanyRepository,
          useValue: { isOwnedByUser: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<FinancialsService>(FinancialsService);
    financialRepository = module.get(FinancialRepository);
    companyRepository = module.get(CompanyRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a financial', async () => {
    const company = new Company();
    company.uuid = faker.datatype.uuid();

    const financialDto = new CreateFinancialDto();
    financialDto.company = company.uuid;

    const resolvedFinancial = new Financial();
    resolvedFinancial.uuid = faker.datatype.uuid();
    resolvedFinancial.id = faker.datatype.number();
    resolvedFinancial.company = company.uuid;

    const user = { id: faker.datatype.uuid(), role: UserRole.ADMIN };

    jest
      .spyOn(companyRepository, 'isOwnedByUser')
      .mockImplementationOnce(() => {
        return Promise.resolve(true);
      });

    jest
      .spyOn(financialRepository, 'createFinancial')
      .mockResolvedValue(resolvedFinancial);

    const data = await service.create(user, financialDto);

    expect(data).toEqual(resolvedFinancial);
  });

  it('should get a financial by uuid', async () => {
    const financial = new Financial();
    financial.uuid = faker.datatype.uuid();

    jest.spyOn(financialRepository, 'findOne').mockImplementationOnce(() => {
      return Promise.resolve(financial);
    });

    const data = await service.findOne(financial.uuid);

    expect(data).toEqual(financial);
  });

  it('should find financials by queryString', async () => {
    const financial = new Financial();
    financial.uuid = faker.datatype.uuid();

    const resolvedFinancials = new ReturnFindFinancialsDto();
    resolvedFinancials.financials = [financial];

    const queryDto = new FindFinancialsQueryDto();
    queryDto.company = faker.datatype.uuid();

    jest
      .spyOn(financialRepository, 'findFinancials')
      .mockResolvedValue(resolvedFinancials);

    const data = await service.findAll(queryDto);

    expect(data).toEqual(resolvedFinancials);
  });

  it('should remove a financial by uuid', async () => {
    jest
      .spyOn(financialRepository, 'delete')
      .mockResolvedValue(new DeleteResult());

    await service.remove(faker.datatype.uuid());
  });
});
