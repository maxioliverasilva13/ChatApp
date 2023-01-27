import typeorm from "typeorm"
var EntitySchema = typeorm.EntitySchema;

export const Chat = new EntitySchema({
    name: "chats", // Will use table name `post` as default behaviour.
    tableName: "chats", // Optional: Provide `tableName` property to override the default behaviour for table name.
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        message: {
            type: "varchar",
        },
        time: {
            type: "timestamp",
            nullable: false,
            default: () => "CURRENT_TIMESTAMP",
        },
    },
    relations: {
        from: {
            type: "many-to-one",
            target: "users",
            joinColumn: {
                name: "from"
            },
            unique: false,
            index: {
                unique: false,
            }
        },
        to: {
            type: "many-to-one",
            target: "users",
            joinColumn: {
                name: "to"
            },
            unique: false,
            index: {
                unique: false,
            }
        },
    },
});