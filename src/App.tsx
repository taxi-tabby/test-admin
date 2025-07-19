import { Admin, Resource, List, Datagrid, TextField, Edit, SimpleForm, TextInput, EditButton, required } from "react-admin";
import { Layout } from "./Layout";
// JSON API Data Provider 사용
import { dataProvider } from "./dataProvider";
import { authProvider } from "./authProvider";
import { People, Article, Category } from "@mui/icons-material";



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

const PostList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="author" />
      <TextField source="published_at" />
      <EditButton />
    </Datagrid>
  </List>
);

const PostEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled label="게시물 ID" />
      <TextInput source="title" label="제목" validate={required()} />
      <TextInput source="author" label="작성자" validate={required()} />
      <TextInput source="content" multiline label="내용" />
      <TextInput source="published_at" label="발행일" />
    </SimpleForm>
  </Edit>
);

const CategoryList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="description" />
      <EditButton />
    </Datagrid>
  </List>
);

const CategoryEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled label="카테고리 ID" />
      <TextInput source="name" label="카테고리명" validate={required()} />
      <TextInput source="description" label="설명" multiline />
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
      
      <Resource 
        name="posts" 
        list={PostList}
        edit={PostEdit}
        icon={Article}
        options={{ label: '게시물 관리' }}
      />
      
      <Resource 
        name="categories" 
        list={CategoryList}
        edit={CategoryEdit}
        icon={Category}
        options={{ label: '카테고리 관리' }}
      />

    </Admin>

  </>
)