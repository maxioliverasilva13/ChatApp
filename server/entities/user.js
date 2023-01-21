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
    // rol: {
    //   type: "many-to-one",
    //   target: "rol",
    //   joinColumn: true,
    // },
    // localidad: {
    //   type: "many-to-one",
    //   target: "localidad",
    //   joinColumn: true,
    //   cascade: true,
    //   nullable: true,
    //   onDelete: "SET NULL",
    // },
  },
});