import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './repositories/users.repository';
import { UsersService } from './users.service';
import { UserRole } from './user-roles.enum';
import { CreateUserDto } from './dto/create-user.dto';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FindUsersQueryDto } from './dto/find-users-query.dto';

const mockUserRepository = () => ({
  createUser: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  findUsers: jest.fn(),
  update: jest.fn(),
});

describe('UsersService', () => {
  let userRepository;
  let service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useFactory: mockUserRepository,
        },
      ],
    }).compile();

    userRepository = await module.get<UserRepository>(UserRepository);
    service = await module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(userRepository).toBeDefined();
  });

  describe('createUser', () => {
    let mockCreateUserDto: CreateUserDto;

    beforeEach(() => {
      mockCreateUserDto = {
        email: 'mock@email.com',
        name: 'mock name',
        password: 'mock password',
        passwordConfirmation: 'mock password',
      };
    });

    it('should create an user if passwords match', async () => {
      userRepository.createUser.mockResolvedValue('mockUser');
      const result = await service.createAdminUser(mockCreateUserDto);

      expect(userRepository.createUser).toHaveBeenCalledWith(
        mockCreateUserDto,
        UserRole.ADMIN,
      );
      expect(result).toEqual('mockUser');
    });

    it('should throw an error if passwords do not match', async () => {
      mockCreateUserDto.passwordConfirmation = 'wrongPassword';
      expect(service.createAdminUser(mockCreateUserDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('findUserByUuid', () => {
    it('should return the found user', async () => {
      userRepository.findOne.mockResolvedValue('mockUser');
      expect(userRepository.findOne).not.toHaveBeenCalled();

      const result = await service.findUserByUuid('mockUuid');
      const select = ['email', 'name', 'role', 'uuid'];
      expect(userRepository.findOne).toHaveBeenCalledWith('mockUuid', {
        select,
      });
      expect(result).toEqual('mockUser');
    });

    it('should throw an error as user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      expect(service.findUserByUuid('mockUuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteUser', () => {
    it('should return affected > 0 if user is deleted', async () => {
      userRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteUser('mockUuid');
      expect(userRepository.delete).toHaveBeenCalledWith({ uuid: 'mockUuid' });
    });

    it('should throw an error if no user is deleted', async () => {
      userRepository.delete.mockResolvedValue({ affected: 0 });

      expect(service.deleteUser('mockUuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findUsers', () => {
    it('should call the findUsers method of the userRepository', async () => {
      userRepository.findUsers.mockResolvedValue('resultOfSearch');
      const mockFindUsersQueryDto: FindUsersQueryDto = {
        name: '',
        email: '',
        limit: 1,
        page: 1,
        role: '',
        sort: '',
        is_active: true,
      };
      const result = await service.findUsers(mockFindUsersQueryDto);
      expect(userRepository.findUsers).toHaveBeenCalledWith(
        mockFindUsersQueryDto,
      );
      expect(result).toEqual('resultOfSearch');
    });
  });

  describe('updateUser', () => {
    it('should return affected > 0 if user data is updated and return the new user', async () => {
      userRepository.update.mockResolvedValue({ affected: 1 });
      userRepository.findOne.mockResolvedValue('mockUser');

      const result = await service.updateUser('mockUpdateUserDto', 'mockUuid');
      expect(userRepository.update).toHaveBeenCalledWith(
        { uuid: 'mockUuid' },
        'mockUpdateUserDto',
      );
      expect(result).toEqual('mockUser');
    });

    it('should throw an error if no row is affected in the DB', async () => {
      userRepository.update.mockResolvedValue({ affected: 0 });

      expect(
        service.updateUser('mockUpdateUserDto', 'mockUuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
