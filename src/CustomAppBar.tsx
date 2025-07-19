import { UserMenu, LoadingIndicator, ToggleThemeButton, useTheme } from 'react-admin';
import { AppBar as MuiAppBar, Toolbar, Box, Typography } from '@mui/material';

export const CustomAppBar = () => {
  const [theme] = useTheme();
  
  return (
    <MuiAppBar 
      position="static"
      sx={{ 
        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#1976d2',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        {/* 왼쪽에 사이트 제목 */}
        <Typography variant="h6" color="inherit" sx={{ marginLeft: 1 }}>
          커어어어어스텀 관리자 대시보드
        </Typography>
        
        <Box flex="1" />
        
        {/* 중앙에 로딩 인디케이터 */}
        <LoadingIndicator />
        
        {/* 다크모드 토글 */}
        <ToggleThemeButton />
        
        {/* 사용자 메뉴 */}
        <UserMenu />
      </Toolbar>
    </MuiAppBar>
  );
};
