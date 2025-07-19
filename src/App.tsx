import { Admin, Resource, List, Datagrid, TextField } from "react-admin";
import { Layout } from "./Layout";
import { dataProvider } from "./dataProvider";
import { authProvider } from "./authProvider";

const UserList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="username" />
      <TextField source="fullName" />
    </Datagrid>
  </List>
);

export const App = () => (
  <>
    <Admin
      layout={Layout}
      dataProvider={dataProvider}
      authProvider={authProvider}
    >
      {/* Add your resources here */}
      <Resource name="users" list={UserList} />

    </Admin>

  </>
)