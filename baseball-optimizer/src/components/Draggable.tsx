import {useDraggable} from '@dnd-kit/core';
import {CSS} from '@dnd-kit/utilities';


function Draggable({value}) {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: `${value}`,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
  };
  
  return (
    <button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div>{value}</div>
    </button>
  );
}

export default Draggable;