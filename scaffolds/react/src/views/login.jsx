import LoginForm from "../components/loginform";
import {CSSTransition} from "react-transition-group";
import {useState, useEffect} from 'react'

export default function Login({history}){
    const [isMounted, setMounted] = useState(false)

    const styles = {
        rootContainer: {
            height: '100vh',
            width: '100vw',
            overflow: 'hidden'
        },
        loginForm: {
            width: 400,
            height: 400,
            borderRadius: 4,
            margin: '10% auto',
            boxShadow: '0px 4px 15px 0px rgba(0,0,0,.5)',
            padding: 10,
            backgroundColor: '#fff'
        },
        formHeader: {
            fontFamily: 'Roboto, sans-serif',
            textAlign: 'center',
            marginBottom: 70,
            borderBottom: '1px solid lightgray',
            color: '#1890FF'
        },
        formFooter: {
            borderTop: '1px solid lightgray',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            marginTop: 50,
            fontFamily: 'Roboto, sans-serif',
            paddingTop: 10
        },
        logo: {
            width: 80
        },
        bgLogo: {
            position: 'absolute',
            top: 10,
            zIndex: -1,
            width: '80%',
            left: 5
        },
        phrase: {
            fontFamily: 'Roboto, sans-serif',
            fontSize: '7.5rem',
            position: 'absolute',
            bottom: 10,
            right: 20,
            color: '#424242',
            zIndex: -2
        }
    }

    useEffect(() => {
        setMounted(true)
    },
        //eslint-disable-next-line react-hooks/exhaustive-deps
        [])

    return (
        <CSSTransition
            classNames='route-transition'
            in={isMounted}
            timeout={500}
            mountOnEnter
            unmountOnExit
        >
            <section style={styles.rootContainer}>
                <div style={styles.loginForm}>
                    <div>
                        <h2 style={styles.formHeader}>Giddy React App Login</h2>
                    </div>
                    <LoginForm history={history}/>
                    <div style={styles.formFooter}>
                        <div>Powered by</div>
                        <img style={styles.logo} src='assets/logo.svg' alt='logo'/>
                    </div>
                </div>
                <img style={styles.bgLogo} src='assets/logo.svg' alt='logo'/>
                <div style={styles.phrase}>
                    Applications made easier
                </div>
            </section>
        </CSSTransition>
    )
}