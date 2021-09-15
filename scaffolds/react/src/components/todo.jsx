import {Button, Checkbox} from "antd";
import {DeleteOutlined} from "@ant-design/icons";

export default function TodoComponent({todo, deleteMutation}){
    const styles = {
        todo: {
            borderRadius: 4,
            margin: 10,
            width: 400,
            border: '1px solid lightgray',
            padding: 10
        },
        todoActions: {
            display: 'flex',
            justifyContent: 'space-between'
        }
    }


    return (
        <div style={styles.todo}>
            <h3>Description: {todo.title}</h3>
            <div style={styles.todoActions}>
                <div>Completed: <Checkbox checked={todo.completed}/></div>
                <Button
                    onClick={() => deleteMutation.mutate(todo.id)}
                    type="danger"
                    icon={<DeleteOutlined/>}
                />
            </div>
        </div>
    )
}