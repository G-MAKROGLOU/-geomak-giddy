import {GithubOutlined} from '@ant-design/icons'

export default function Footer(){
    const styles = {
        footer: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0px 50px',
            marginTop: 50,
            borderTop: '1px solid lightgray',
            paddingTop: 20
        },
        footerImage: {
            width: 180
        },
        footerCopyRight: {
            fontSize: '1.5rem',
            fontWeight: 'bolder',
            fontFamily: 'Roboto, sans-serif'
        },
        iconStyle: {
            fontSize: '1.8rem',
            color: 'black'
        },
        npmLogo: {
            width: 50,
            marginLeft: 10
        }
    }

    const getYear = () => {
        let date = new Date();
        return date.getUTCFullYear()
    }

    return (
        <footer style={styles.footer}>
            <div style={styles.footerCopyRight}>@Giddy {getYear()} &copy;</div>
           <div>
               <a href="https://github.com/G-MAKROGLOU/-geomak-giddy" rel="noreferrer" target="_blank"><GithubOutlined style={styles.iconStyle}/></a>
               <a href="https://www.npmjs.com/package/@geomak/giddy" rel="noreferrer" target="_blank"><img style={styles.npmLogo} src="assets/npm.png" alt="npm"/></a>
           </div>
            <img style={styles.footerImage} src='assets/logo.svg' alt='logo'/>
        </footer>
    )
}