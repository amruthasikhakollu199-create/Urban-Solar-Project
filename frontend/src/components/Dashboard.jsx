import InputForm from "./InputForm";

function Dashboard() {
  return (
    <div className="dashboard">
      <header>
        <h2>Urban Solar & Grid Load Forecasting</h2>
        <p>Enter the required data to predict grid demand.</p>
      </header>

      <InputForm />
    </div>
  );
}

export default Dashboard;