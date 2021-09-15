import {Menu, Button, Avatar, Popover} from "antd";
import {
    HomeOutlined,
    CalendarOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined
} from '@ant-design/icons'

export default function MenuBar({history, activeItem}){

    const styles = {
        logo: {
            width: 100
        },
        rootContainer: {
            display: 'flex',
            alignItems: 'center',
            padding: 10
        },
        menuBar: {
            width: '95%'
        },
        avatar: {
            cursor: 'pointer',
            backgroundColor: 'royalblue'
        }
    }

    const popoverContent = () => (
        <div>
            <div>
                <Button icon={<UserOutlined/>} type='link'>Profile</Button>
            </div>
            <div>
                <Button icon={<SettingOutlined/>} type='link'>Settings</Button>
            </div>
            <hr/>
            <div>
                <Button onClick={() => history.push('/')} icon={<LogoutOutlined/>} type='link'>Sign out</Button>
            </div>
        </div>
    )

    return (
        <div style={styles.rootContainer}>
            <Button type='link' onClick={() => history.push('/home')}>
                <img style={styles.logo} src='assets/logo.svg' alt='logo'/>
            </Button>
            <Menu style={styles.menuBar} selectedKeys={[activeItem]} onClick={e => history.push(`/${e.key}`)} mode="horizontal">
                <Menu.Item icon={<HomeOutlined/>} key='home'>
                    Home
                </Menu.Item>
                <Menu.Item icon={<CalendarOutlined />} key='todo'>
                    To do
                </Menu.Item>
            </Menu>
            <Popover content={popoverContent} placement="right">
                <Avatar style={styles.avatar} size='large' icon={<UserOutlined/>}/>
            </Popover>
        </div>
    )
}