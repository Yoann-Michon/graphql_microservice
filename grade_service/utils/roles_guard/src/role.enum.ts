import { registerEnumType } from "@nestjs/graphql";

export enum Role{
    STUDENT="STUDENT",
    PROFESSOR="PROFESSOR"
}

registerEnumType(Role, {
    name: 'Role',
    description: 'Rôles utilisateur disponibles',
  });