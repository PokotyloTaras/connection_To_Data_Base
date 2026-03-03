import dotenv from 'dotenv'
dotenv.config()

import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
   connectionString: `${process.env.DB_URL}`
});

const initializeDatabase = async () => {
  console.log('🔄 Initializing database...');
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS deadSpace (
      id SERIAL PRIMARY KEY,
      name_of_gun TEXT NOT NULL,
      damage_type TEXT NOT NULL,
      demage_dealth TEXT NOT NULL,
      reload_seconds TEXT NOT NULL,
      additional_info TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(createTableQuery);
    console.log('✅ Database table initialized successfully');
 } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};

initializeDatabase()

async function getData() {
   await pool.connect();
   const { rows } = await pool.query('SELECT * from deadSpace')
   console.log("Rows => ", rows);
   await pool.end()
}

async function addInfo(){
   await pool.query("insert into deadSpace (name_of_gun, damage_type, demage_dealth, reload_seconds, additional_info) values ('plasma_cutter', 'slashing', '10', '4', 'The best gun in game')");
}

async function deleteRow() {
   await pool.query(`delete from deadSpace where id=2`)
}
deleteRow()
async function updateRow() {
   await pool.query(`update deadSpace set additional_info='lalala'`)
}
updateRow()

getData()
addInfo()
