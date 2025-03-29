import { useDroppable } from '@dnd-kit/core';
import React from 'react';

interface DroppableProps {
    id: string;
    children: React.ReactNode;
}

const labels = {
    wantsToPlay: "Wants to Play",
    canPlay: "Can Play",
    cannotPlay: "Cannot Play"
};
Object.freeze(labels);

function Droppable({ id, children }: DroppableProps) {
    const { setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div
            ref={setNodeRef}
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '150px',
                width: '200px',
                backgroundColor: 'rgb(219, 219, 219)',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '20px',
                margin: '10px'
            }}
        >   
            <h2>{labels[id]}</h2>
            {children}
        </div>
    );
}

export default Droppable;