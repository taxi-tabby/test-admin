import type { ReactNode } from "react";
import { CheckForApplicationUpdate, Sidebar, Menu, useTheme } from "react-admin";
import { CustomAppBar } from "./CustomAppBar";
import { Box } from "@mui/material";

export const Layout = ({ children }: { children: ReactNode }) => {
  const [theme] = useTheme();
  
  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      height="100vh"
      sx={{
        backgroundColor: theme === 'dark' ? '#121212' : '#f5f5f5'
      }}
    >
      <CustomAppBar />
      <Box display="flex" flex="1" overflow="hidden">
        <Sidebar>
          <Menu />
        </Sidebar>
        <Box 
          component="main" 
          flex="1" 
          padding={1}
          overflow="auto"
          sx={{ 
            marginTop: 0,
            paddingTop: 1,
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f5f5f5'
          }}
        >
          {children}
        </Box>
      </Box>
      <CheckForApplicationUpdate />
    </Box>
  );
};
