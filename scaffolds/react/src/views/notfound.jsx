import Footer from "../components/footer";
import {CSSTransition} from "react-transition-group";
import {useEffect, useState} from "react";

export default function NotFound(props){
    const [isMounted, setMounted] = useState(false)

    const styles = {
        root: {
          paddingTop: 100
        },
        oops: {
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 'bolder',
          fontSize: '3rem',
          textAlign: 'center'
        },
        image: {
            width: 600,
            display: 'block',
            margin: '0 auto'
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
            <section style={styles.root}>
                <div style={styles.oops}>Oops! Looks like we don't know about that page!</div>
                <img style={styles.image} src="assets/not_found.svg" alt="not found"/>
                <Footer/>
            </section>
        </CSSTransition>
    )
}