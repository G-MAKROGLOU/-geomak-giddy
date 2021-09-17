import {CSSTransition} from "react-transition-group";
import {useEffect, useState} from "react";
import MenuBar from "../components/menubar";
import Footer from "../components/footer";

export default function Home({history}){
    const [isMounted, setMounted] = useState(false)

    const styles = {
        content: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-around'
        },
        contentNode: {
            borderRadius: 4,
            boxShadow: '0px 4px 15px 0px rgba(0,0,0,.5)',
            width: '80%',
            margin: 10,
            padding: 20
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
            <section>
                <MenuBar history={history} activeItem={'home'}/>
                <div style={styles.content}>
                    <div style={styles.contentNode}>
                        <h1>React app by Giddy</h1>
                        <div>
                            This is a scaffolded app with Giddy that comes with some of the most useful libraries pre-installed to speed-up the process of project setup and
                            development. The libraries that are pre-installed are:
                            <ul>
                                <li>React Router</li>
                                <li>React Query</li>
                                <li>Ant Design</li>
                                <li>Ant Design Icons</li>
                                <li>React Transition Group</li>
                            </ul>
                            Below you will find more information for each one of those libraries together with links to their website and documentation in case you are not
                            familiar with them. In most cases, the selected libraries would suffice but you can always remove, change or add modules according to your needs.
                            The sole purpose of these libraries is to set you up quickly with a React app to avoid writing boilerplate code for the setup and dive right into the
                            development. The app also includes a native Context API implementation for global state management but you can always opt-in for something like React-Redux.
                        </div>

                        <div>
                            In the app, you will find also three already implemented routes:
                            <ul>
                                <li>Login route</li>
                                <li>Home route</li>
                                <li>To Do route (quick example of react-query)</li>
                                <li>Not Found route</li>
                            </ul>
                        </div>
                    </div>
                    <div style={styles.contentNode}>
                        <h1>React Router</h1>
                        <div>
                            React router is a third-party library that is almost the default way to implement page routing in a React application. It is implemented at the root of the app,
                            right after the Context API provider and all routes assigned to it, inherit the "history" prop. You can use the history prop to navigate to different pages of your app,
                            with the use of history.push("/route-name"), history.goBack() etc.
                            You can find more on React Router in the official library documentation <a target="_blank" rel="noreferrer" href="https://reactrouter.com/web/guides/quick-start">here</a>
                        </div>
                    </div>
                    <div style={styles.contentNode}>
                        <h1>React Query</h1>
                        <div>
                            React query is another third-party library that creates an "abstraction" layer on a component's state management. It is extremely useful for components that depend
                            on network received data because it provides functionalities such as automatic retries, automatic data refresh, data caching, loading and error values and more. It
                            essentially makes the state management of those components less cumbersome because it does all the heavy-lifting for us within a few lines instead of writing effects
                            and handling them. You can find more on React Query in the official library documentation <a target="_blank" rel="noreferrer" href="https://react-query.tanstack.com/overview">here.</a>
                            You will also see an icon on the bottom left corner of your screen which is the developer tools for react query through which you can review all the network request your app has performed,
                            their status etc.
                        </div>
                    </div>
                    <div style={styles.contentNode}>
                        <h1>Ant Design & Ant Design Icons</h1>
                        <div>
                            Ant Design is a very popular UI framework for React that provides us with high quality components for the most things that we might want to implement in an App and that
                            speeds up application development significantly. An example is the Forms that Ant Design provides that come with validators, easy property access, event handlers etc.
                            A similar approach without Ant Design would be to use 2-3 third-party libraries like Formik, Yup and a UI library like React Bootstrap but Ant Design prevents all that fuzz.
                            Ant Design Icons are the Icon package of Ant Design that comes in a separate package in case you don't want to use it. However, you can implement other icon packages as well through
                            Ant Design Icons, such as FontAwesome etc. You can find more on Ant Design and Ant Design Icons in the official library documentation <a target="_black" rel="noreferrer" href="https://ant.design/components/overview/">here.</a>
                        </div>
                    </div>
                    <div style={styles.contentNode}>
                        <h1>React Transition Group</h1>
                        <div>
                            React Transition Group is another third-party library that helps with the creation of smooth page transitions. Its' effects are mostly aesthetic and do not provide any significant
                            performance benefits but more of an aesthetic touch to our application that makes it feel much smoother when switching between routes. The Giddy app comes with a transition effect
                            already implemented for all the involved routes and you can find more on React Transition Group in the official library documentation <a target="_black" rel="noreferrer" href="https://reactcommunity.org/react-transition-group/">here.</a>
                        </div>
                    </div>
                </div>
                <Footer/>
            </section>
        </CSSTransition>
    )
}