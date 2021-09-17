import {useMutation, useQuery} from "react-query";
import Requests from "../services/requests";
import {CSSTransition} from "react-transition-group";
import {useEffect, useState} from "react";
import MenuBar from "../components/menubar";
import {Spin} from "antd";
import TodoComponent from "../components/todo";
import Footer from "../components/footer";

export default function Todo({history}){
    const [isMounted, setMounted] = useState(false)

    const styles = {
        todoContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        },
        basicUsage: {
            fontSize: '1.8rem',
            fontFamily: 'Roboto, sans-serif',
            textAlign: 'center'
        },
        disclaimer: {
            textAlign: 'center'
        }
    }

    const {isLoading, isError, data, refetch} = useQuery(['todos'], () => Requests.get_todos())

    const deleteMutation = useMutation(todoId => Requests.delete_todo(todoId), {
        onSuccess: async () => {
            await refetch()
        },
        onError: async () => {
            //TODO: Do something here when there is an error
        }
    })

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
                <MenuBar history={history} activeItem={'todo'}/>
                <Spin spinning={isLoading} size="large">
                    <div style={styles.basicUsage}>Basic usage demonstration of React-Query</div>
                    <div style={styles.disclaimer}>Check <a href="https://jsonplaceholder.typicode.com/guide/" target="_blank" rel="noreferrer">jsonplaceholder</a> for info on how their API works</div>
                    <div style={styles.disclaimer}>Data are not getting deleted but the source code shows how you would handle such operations through React-Query mutations</div>
                    <div style={styles.todoContainer}>
                        {
                            isError
                                ? <div>Error</div>
                                : data && data.map(todo => (
                                <TodoComponent
                                    key={todo.id} todo={todo}
                                    deleteMutation={deleteMutation}
                                />
                            ))
                        }
                    </div>
                </Spin>
                <Footer/>
            </section>
        </CSSTransition>
    )
}