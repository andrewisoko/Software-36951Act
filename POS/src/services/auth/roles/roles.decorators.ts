import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/virtual_terminal/entity/wt.entity';

export function Roles(...roles:Role[]){
    return SetMetadata("ROLES_KEY",roles)
}