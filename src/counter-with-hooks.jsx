import React from 'react';

export default function CounterWithHooks({ initialCount = 0 }) {
    const [count, setCount] = React.useState(initialCount);

    const handleCountIncrement = React.useCallback(() => {
        setCount(count + 1);
    }, [count]);

    return (
        <>
            <div className="counter">
                {count}
            </div>
            <button onClick={handleCountIncrement}>+</button>
        </>
    )
}