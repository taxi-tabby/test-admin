import { Admin, Resource, List, Datagrid, TextField, Edit, SimpleForm, TextInput, EditButton, required } from "react-admin";
import { Layout } from "./Layout";
import { dataProvider } from "./dataProvider";
import { authProvider } from "./authProvider";
import { People } from "@mui/icons-material";

const UserList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="username" />
      <TextField source="fullName" />
      <EditButton />
    </Datagrid>
  </List>
);

const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled label="사용자 ID" />
      <TextInput source="username" label="사용자명" validate={required()} />
      <TextInput source="fullName" label="전체 이름" validate={required()} />
      <TextInput source="password" type="password" label="비밀번호" />
    </SimpleForm>
  </Edit>
);




export const App = () => (
  <>
    <Admin
      layout={Layout}
      dataProvider={dataProvider}
      authProvider={authProvider}
    >
      {/* Add your resources here */}
      <Resource 
        name="users" 
        list={UserList}
        edit={UserEdit}
        icon={People}
        options={{ label: '사용자 관리' }}
      />

    </Admin>

  </>
)