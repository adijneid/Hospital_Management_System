import { UseGuards } from '@nestjs/common';
import {
  Args,
  Field,
  ID,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { JwtPayload } from '../../auth/jwt.strategy';
import type {
  RoomStatus,
  RoomType,
} from '../../rooms/room.entity';
import { RoomsService } from '../../rooms/rooms.service';
import { RoomModel } from '../appointments/room.model';
import { GqlJwtAuthGuard } from '../gql-jwt-auth.guard';

const ROOM_TYPES = ['consultation', 'treatment', 'surgery'] as const;
const ROOM_STATUSES = ['available', 'occupied', 'maintenance'] as const;

@InputType()
export class CreateRoomInput {
  @Field() @IsString() @MinLength(1) room_number: string;
  @Field(() => String) @IsIn(ROOM_TYPES) room_type: RoomType;
  @Field(() => Int) @IsInt() floor: number;
  @Field(() => Int) @IsInt() @Min(1) capacity: number;
}

@InputType()
export class UpdateRoomInput {
  @Field(() => String, { nullable: true }) @IsOptional() @IsString() room_number?: string;
  @Field(() => String, { nullable: true }) @IsOptional() @IsIn(ROOM_TYPES) room_type?: RoomType;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() floor?: number;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) capacity?: number;
  @Field(() => String, { nullable: true }) @IsOptional() @IsIn(ROOM_STATUSES) status?: RoomStatus;
}

@Resolver(() => RoomModel)
@UseGuards(GqlJwtAuthGuard)
export class RoomsResolver {
  constructor(private readonly svc: RoomsService) {}

  @Query(() => [RoomModel])
  rooms() {
    return this.svc.findAll();
  }

  @Query(() => RoomModel, { nullable: true })
  room(@Args('id', { type: () => ID }) id: string) {
    return this.svc.findById(id);
  }

  @Query(() => [RoomModel])
  availableRooms(
    @Args('roomType', { type: () => String, nullable: true }) roomType?: RoomType,
  ) {
    return roomType
      ? this.svc.findAvailableByType(roomType)
      : this.svc.findAvailable();
  }

  @Query(() => Int)
  roomCount() {
    return this.svc.count();
  }

  @Mutation(() => RoomModel)
  createRoom(
    @Args('input') input: CreateRoomInput,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'staff') {
      throw new Error('Only staff may create rooms.');
    }
    return this.svc.create(input as any);
  }

  @Mutation(() => RoomModel)
  updateRoom(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateRoomInput,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'staff') {
      throw new Error('Only staff may update rooms.');
    }
    return this.svc.update(id, input as any);
  }

  @Mutation(() => RoomModel)
  updateRoomStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => String }) status: RoomStatus,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'staff') {
      throw new Error('Only staff may change room status.');
    }
    return this.svc.updateStatus(id, { status } as any);
  }

  @Mutation(() => Boolean)
  async deleteRoom(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'staff') {
      throw new Error('Only staff may delete rooms.');
    }
    await this.svc.remove(id);
    return true;
  }
}
