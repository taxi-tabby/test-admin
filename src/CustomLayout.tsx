import { ReactNode } from "react";
import { Box } from "@mui/material";
import { CustomAppBar } from "./CustomAppBar";
import { Sidebar, Menu } from "react-admin";

export const CustomLayout = ({ children }: { children: ReactNode }) => (
  <Box display="flex" flexDirection="column" height="100vh">
    <CustomAppBar />
    <Box display="flex" flex="1" overflow="hidden">
      <Sidebar>
        <Menu />
      </Sidebar>
      <Box 
        component="main" 
        flex="1" 
        padding={2}
        overflow="auto"
        sx={{ 
          marginTop: 0,
          paddingTop: 2 
        }}
      >
        {children}
      </Box>
    </Box>
  </Box>
);
