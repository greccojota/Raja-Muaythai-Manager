import React, { useState } from 'react'
import {
  AppBar, Avatar, BottomNavigation, BottomNavigationAction, Box, Collapse, CssBaseline, Divider, Drawer,
  IconButton, List, ListItemButton, ListItemIcon, ListItemText,
  Paper, Toolbar, Tooltip, Typography,
  useMediaQuery, useTheme,
} from '@mui/material'
import {
  Dashboard as DashboardIcon, Groups as StudentsIcon,
  CardMembership as PlansIcon, AttachMoney as FinancialIcon,
  FitnessCenter as ClassesIcon, EmojiEvents as GraduationIcon,
  Event as EventsIcon, SportsKabaddi as AthletesIcon,
  Gavel as JudgesIcon, Handshake as SponsorsIcon,
  AccountTree as BracketsIcon, Menu as MenuIcon, ChevronLeft,
  ExpandLess, ExpandMore, Logout as LogoutIcon,
  School as InstructorsIcon,
} from '@mui/icons-material'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { RAJA_DARK } from '@/theme'

const DRAWER_WIDTH = 256
const MOBILE_NAV_HEIGHT = 72

interface NavItem  { label: string; icon: React.ReactNode; path: string }
interface NavGroup { label: string; icon: React.ReactNode; path: string; children?: NavItem[] }

const navGroups: NavGroup[] = [
  { label: 'Dashboard',         icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Alunos',            icon: <StudentsIcon />,  path: '/students'  },
  { label: 'Planos',            icon: <PlansIcon />,     path: '/plans'     },
  { label: 'Financeiro',        icon: <FinancialIcon />, path: '/financial' },
  { label: 'Aulas',             icon: <ClassesIcon />,      path: '/classes'     },
  { label: 'Professores',       icon: <InstructorsIcon />,  path: '/instructors' },
  { label: 'Graduação',         icon: <GraduationIcon />,   path: '/graduation'  },
  {
    label: 'Eventos',
    icon: <EventsIcon />,
    path: '/events',
    children: [
      { label: 'Gestão de Eventos', icon: <EventsIcon />,   path: '/events'    },
      { label: 'Atletas',           icon: <AthletesIcon />, path: '/athletes'  },
      { label: 'Juízes',            icon: <JudgesIcon />,   path: '/judges'    },
      { label: 'Patrocinadores',    icon: <SponsorsIcon />, path: '/sponsors'  },
      { label: 'Chaveamento',       icon: <BracketsIcon />, path: '/brackets'  },
    ],
  },
]

export function MainLayout() {
  const muiTheme = useTheme()
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'))
  const [drawerOpen, setDrawerOpen] = useState(!isMobile)
  const [eventsOpen, setEventsOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleNav = (path: string) => {
    navigate(path)
    if (isMobile) setDrawerOpen(false)
  }

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')
  const isEventSection = ['/events','/athletes','/judges','/sponsors','/brackets']
    .some(p => location.pathname.startsWith(p))

  const mobileNavItems = navGroups.slice(0, 5)
  const currentMobilePath = mobileNavItems.find(item => isActive(item.path))?.path ?? false

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: RAJA_DARK }}>
      {/* Logo */}
      <Box sx={{ px: 2, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="img"
          src="/logo.jpeg"
          alt="Raja Stadium"
          sx={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'contain',
            bgcolor: '#1a1a1a', border: '1.5px solid rgba(255,255,255,.15)' }}
          onError={(e: any) => { e.target.style.display='none' }}
        />
        <Box sx={{ display: 'block', overflow: 'hidden' }}>
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.1, fontSize: 13 }}>
            ARENA THAI
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.5)', fontSize: 10, fontWeight: 500 }}>
            RAJA STADIUM
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={() => setDrawerOpen(false)} size="small" sx={{ ml: 'auto', color: 'rgba(255,255,255,.5)' }}>
            <ChevronLeft fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,.08)', mx: 2 }} />

      {/* Nav */}
      <List sx={{ px: 1.5, pt: 1.5, flex: 1, overflow: 'auto' }}>
        {navGroups.map(item => {
          if (!item.children) {
            const active = isActive(item.path)
            return (
              <ListItemButton
                key={item.path}
                onClick={() => handleNav(item.path)}
                sx={{
                  borderRadius: 2, mb: 0.5, py: 1,
                  color: active ? '#fff' : 'rgba(255,255,255,.55)',
                  bgcolor: active ? 'rgba(198,40,40,.85)' : 'transparent',
                  '&:hover': {
                    bgcolor: active ? 'rgba(198,40,40,.85)' : 'rgba(255,255,255,.07)',
                    color: '#fff',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 500 }} />
              </ListItemButton>
            )
          }
          return (
            <Box key={item.path}>
              <ListItemButton
                onClick={() => setEventsOpen(o => !o)}
                sx={{
                  borderRadius: 2, mb: 0.5, py: 1,
                  color: isEventSection ? '#fff' : 'rgba(255,255,255,.55)',
                  bgcolor: isEventSection && !eventsOpen ? 'rgba(198,40,40,.6)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,.07)', color: '#fff' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
                {eventsOpen ? <ExpandLess sx={{ color: 'rgba(255,255,255,.5)' }} fontSize="small" />
                             : <ExpandMore sx={{ color: 'rgba(255,255,255,.5)' }} fontSize="small" />}
              </ListItemButton>
              <Collapse in={eventsOpen} timeout="auto" unmountOnExit>
                <List disablePadding>
                  {item.children!.map(child => {
                    const active = isActive(child.path)
                    return (
                      <ListItemButton key={child.path} onClick={() => handleNav(child.path)}
                        sx={{
                          borderRadius: 2, ml: 1.5, mb: 0.5, py: 0.75,
                          color: active ? '#fff' : 'rgba(255,255,255,.5)',
                          bgcolor: active ? 'rgba(198,40,40,.8)' : 'transparent',
                          '&:hover': { bgcolor: 'rgba(255,255,255,.07)', color: '#fff' },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 30, color: 'inherit', '& svg': { fontSize: 17 } }}>
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText primary={child.label} primaryTypographyProps={{ fontSize: 13 }} />
                      </ListItemButton>
                    )
                  })}
                </List>
              </Collapse>
            </Box>
          )
        })}
      </List>

      {/* User section */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,.08)', mx: 2 }} />
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(198,40,40,.8)', fontSize: 13, fontWeight: 700 }}>
          {user?.full_name?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600, display: 'block' }} noWrap>
            {user?.full_name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.4)', fontSize: 11 }} noWrap>
            Administrador
          </Typography>
        </Box>
        <Tooltip title="Sair">
          <IconButton size="small" sx={{ color: 'rgba(255,255,255,.4)', '&:hover': { color: '#fff' } }}
            onClick={async () => { await logout(); navigate('/login') }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      <AppBar position="fixed" elevation={0}
        sx={{
          zIndex: muiTheme.zIndex.drawer + 1,
          bgcolor: '#fff',
          borderBottom: '1px solid rgba(0,0,0,.08)',
          color: 'text.primary',
          width: { md: drawerOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%' },
          ml: { md: drawerOpen ? `${DRAWER_WIDTH}px` : 0 },
          transition: muiTheme.transitions.create(['width', 'margin']),
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
          <IconButton edge="start" onClick={() => setDrawerOpen(o => !o)}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            {isMobile && (
              <Box
                component="img"
                src="/logo.jpeg"
                alt="Raja Stadium"
                sx={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'contain' }}
              />
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={800} noWrap>
                Raja Manager
              </Typography>
              {isMobile && (
                <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ lineHeight: 1 }}>
                  Arena Thai
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ flex: 1 }} />
        </Toolbar>
      </AppBar>

      <Drawer variant={isMobile ? 'temporary' : 'persistent'} open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box component="main" sx={{
        flexGrow: 1,
        p: { xs: 1.5, sm: 2.5, lg: 3 },
        mt: { xs: '56px', sm: '64px' },
        pb: { xs: `${MOBILE_NAV_HEIGHT + 16}px`, md: 3 },
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
        minWidth: 0,
        bgcolor: 'background.default',
        transition: muiTheme.transitions.create('margin'),
      }}>
        <Outlet />
      </Box>

      {isMobile && (
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: muiTheme.zIndex.appBar,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <BottomNavigation
            showLabels
            value={currentMobilePath}
            onChange={(_, path) => handleNav(path)}
            sx={{ height: MOBILE_NAV_HEIGHT }}
          >
            {mobileNavItems.map(item => (
              <BottomNavigationAction
                key={item.path}
                label={item.label}
                value={item.path}
                icon={item.icon}
                sx={{
                  minWidth: 0,
                  px: 0.5,
                  '& .MuiBottomNavigationAction-label': { fontSize: 11 },
                  '&.Mui-selected': { color: 'primary.main' },
                }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  )
}
