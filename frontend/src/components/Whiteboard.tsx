import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { useStore } from '../store/useStore';

export function Whiteboard() {
    const { setWhiteboardEditor } = useStore();

    return (
        <div className="w-full h-full relative">
            <Tldraw
                persistenceKey="homework-tools-whiteboard"
                onMount={(editor) => setWhiteboardEditor(editor)}
            />
        </div>
    );
}
