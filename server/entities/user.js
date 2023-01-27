import typeorm from "typeorm"
var EntitySchema = typeorm.EntitySchema;

export const User = new EntitySchema({
  name: "users", // Will use table name `post` as default behaviour.
  tableName: "users", // Optional: Provide `tableName` property to override the default behaviour for table name.
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    isOnline: {
      type: "boolean",
      default: false,
    },
    name: {
      type: "varchar",
    },
    photo: {
      type: "varchar",
      nullable: true,
    },
    password: {
      type: "varchar",
      nullable: true,
    },
    email: {
      type: "varchar",
      unique: true,
    },
  },
  relations: {
    users: {
      type: "many-to-many",
      joinTable: {
        name: "friends",
      },
      target: "users",
    },
  },
});