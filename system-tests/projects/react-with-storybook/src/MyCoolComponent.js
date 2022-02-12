import './App.css';

function MyCoolComponent({text}) {
  return (
    <div className="App">
      <h3>This is Cool {text || ''}</h3>
    </div>
  );
}

export default MyCoolComponent;
