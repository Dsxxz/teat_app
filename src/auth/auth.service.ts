import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants/jwtConstants';
import bcrypt from 'bcrypt';
import { MailAdapter } from '../infrastructure/mail.adapter';
import { RegistrationUserDTO } from './dto/registration-user-DTO';
import { ObjectId } from 'mongodb';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailAdapter,
  ) {}

  async validate(payload: {
    username: string;
    password: string;
  }): Promise<any> {
    const user = await this.usersService.findOne(payload.username);
    if (!user) {
      throw new UnauthorizedException();
    }
    const isPasswordMatch = await bcrypt.compare(
      payload.password,
      user.userPasswordHash,
    );
    if (!isPasswordMatch) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async loginUser(userPayload: any) {
    const payload: { username: any; sub: string } = {
      username: userPayload.login,
      sub: userPayload.id,
    };
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: jwtConstants.secret,
      }),
    };
  }

  async emailResending(email: string) {
    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new BadRequestException('user does not exist');
    }
    const code = await this.usersService.registrateConfirmCode(user._id);
    return this.mailService.emailResending(user.email, code);
  }

  async registrateUsingEmail(code: string) {
    return this.usersService.updateConfirmationIsConfirmed(code);
  }

  async registrate(loginUserDTO: RegistrationUserDTO) {
    const newUser = await this.usersService.createUser(loginUserDTO);
    if (!newUser) {
      throw new Error('something went wrong when creating user');
    }
    try {
      const code = await this.usersService.registrateConfirmCode(
        new ObjectId(newUser.id),
      );
      const mail = await this.mailService.sendConfirmCode(newUser.email, code);
      if (!mail) {
        return this.usersService.deleteUserById(newUser.id);
      }
      return true;
    } catch (e) {
      console.log(e);
    }
  }
}
