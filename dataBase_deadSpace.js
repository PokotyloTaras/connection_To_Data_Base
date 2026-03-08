import dotenv from 'dotenv'
import pg from 'pg';
dotenv.config()

const { Pool } = pg;
const pool = new Pool({
   connectionString: process.env.DB_URL,
   ssl: false 
});

const initializeDatabase = async () => {
   console.log('Initializing deadSpace database...');

   const createTableQuery = `
    CREATE TABLE IF NOT EXISTS deadSpace (
    id SERIAL PRIMARY KEY,
    name_of_gun TEXT NOT NULL,              
    damage_type TEXT DEFAULT 'Slaching',        
    damage_dealth NUMERIC(4, 2),       
    reload_seconds NUMERIC(4, 2),           
    additional_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
  `;
   try {
      await pool.query(createTableQuery);
      console.log('The deadSpace table is ready to go.');
   } catch (error) {
      console.error('Error initializing database:', error.message);
      console.error('Full error:', error);
      throw error;
   }
};
// 2. INSERT — Додавання нової зброї
async function adddeadSpace(name_of_gun, damage_type, damage_dealth, reload_seconds, additional_info) {
   const query = `
        INSERT INTO deadSpace (
            name_of_gun, damage_type, damage_dealth, reload_seconds, additional_info
        ) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`;

   const values = [name_of_gun, damage_type, damage_dealth, reload_seconds, additional_info];

   try {
      const res = await pool.query(query, values);
      console.log('The deadSpace has been added with all the details:', res.rows[0]);
   } catch (err) {
      console.error('Error:', err.message);
   }

}
// 3. SELECT — Перегляд усієї зброї
async function getAlldeadSpace() {
   const res = await pool.query('SELECT id, name_of_gun, damage_dealth, reload_seconds, additional_info FROM deadSpace');
   console.table(res.rows);
}

async function gunExists(id) {
   const res = await pool.query('SELECT * FROM deadSpace WHERE id = $1', [id]);
   return res.rows.length > 0;
}

// 4. UPDATE — Оновлення даних
async function updatedeadSpace(id, updates) {
   if (!(await gunExists(id))) {
      console.error(`Помилка: Зброю з ID ${id} не знайдено`);
      return;
   }

   const query = `
      UPDATE deadSpace 
      SET 
         name_of_gun = COALESCE($1, name_of_gun),
         damage_type = COALESCE($2, damage_type),
         damage_dealth = COALESCE($3, damage_dealth),
         reload_seconds = COALESCE($4, reload_seconds),
         additional_info = COALESCE($5, additional_info)
      WHERE id = $6 
      RETURNING *`;

   const values = [
      updates.name_of_gun ?? null,
      updates.damage_type ?? null,
      updates.damage_dealth ?? null,
      updates.reload_seconds ?? null,
      updates.additional_info ?? null,
      id
   ];

   try {
      const res = await pool.query(query, values);
      console.log('Дані оновлено успішно:', res.rows[0]);
   } catch (err) {
      console.error('Помилка при оновленні:', err.message);
   }
}
// 5. DELETE — Видалення зброї за ID
async function deletedeadSpace(id) {

   if(isNaN(id) || id <= 0){
      console.log("Помилка! ви написали id не числом, або ваше значення id <= 0 ");
      return;
   }

   if (!(await gunExists(id))) {
      console.error(`Помилка: Зброю з ID ${id} не знайдено`);
      return;
   }

   await pool.query('DELETE FROM deadSpace WHERE id = $1', [id]);
   console.log(`The deadSpace with ID ${id} has been removed from the database..`);
}

(async () => {
   try {
      await initializeDatabase();
switch(process.argv[2]) {

   case "list": {
      await getAlldeadSpace();
      break;
   }
   case "add":{ 
      if (process.argv.length < 8){
         console.log("Something went wrong")
         console.log("How to use `add`: node `your_file_name.js` add <name_of_gun> <damage_type> <damage_dealth> <reload_seconds> <additional_info>")
         console.log("Example: node dataBase.js add plasmaCutter slashing 14 4 the best gun")
         break;
   }

   await adddeadSpace(
      process.argv[3],
      process.argv[4],
      parseInt(process.argv[5]),
      parseInt(process.argv[6]),
      process.argv[7],
      process.argv[8]
   );
   break;
}

   case "update": {
      if (process.argv.length < 6) {
         console.log("Помилка! Недостатньо аргументів.");
         console.log("Як користуватися: node dataBase.js update <id> <назва_поля> <нове_значення>");
         console.log("Доступні поля для змінення: name_of_gun, damage_type, damage_dealth, reload_seconds, additional_info");
         break;
      }

      const id = parseInt(process.argv[3]);
      const column = process.argv[4];
      let value = process.argv[5];

      if (isNaN(id)) {
         console.log("Помилка: ID має бути числом.");
         break;
      }

      const allowedColumns = ['name_of_gun', 'damage_type', 'damage_dealth', 'reload_seconds', 'additional_info'];
      if (!allowedColumns.includes(column)) {
         console.log(`Помилка: Поля "${column}" не існує.`);
         console.log("Доступні поля:", allowedColumns.join(", "));
         break;
      }

      if (column === 'damage_dealth' || column === 'reload_seconds') {
         value = parseFloat(value);
         if (isNaN(value)) {
            console.log(`Помилка: Значення для ${column} має бути числом.`);
            break;
         }
      }

      try {
         const query = `UPDATE deadSpace SET ${column} = $1 WHERE id = $2 RETURNING *`;
         const res = await pool.query(query, [value, id]);

         if (res.rows.length === 0) {
            console.log(`Помилка: Зброю з ID ${id} не знайдено.`);
         } else {
            console.log('Дані успішно оновлено:', res.rows[0]);
         }
      } catch (err) {
         console.error('Помилка бази даних:', err.message);
      }
      break;
   }
   case "delete":{
      if (process.argv.length < 4){
         console.log("Something went wrong! Please check if you write everything correctly!")
         console.log("How to use `delete`: node `Your_file_name.js` delete <id>")
         console.log("Example: node dataBase.js delete 3")
         break;
      }
      const id = parseInt(process.argv[3]);

      if (isNaN(id)){
         console.log("id мусить бути числом")
         break;
      }

      await deletedeadSpace(id);
      break;
   }
   case "help":{
      console.log("Доступні команди для роботи з базою:")
      console.log("node dataBase.js list --> показати всю базу даних")
      console.log("node dataBase.js add <name_of_gun> <damage_type> <damage_dealth> <reload_seconds> <additional_info> --> додати до бази нову зброю")
      console.log("node database.js update <id> <name_of_column> <new_value> --> оновлення інформації в конкретній назві поля")
      console.log("node dataBase.js delete <id> --> повне видалення однієї зброї з бази за id")
      break;
   }
}

   } catch (err) {
      console.error("Error:", err.message);
   } finally {
      console.log('Завершення роботи з базою даних...');
      process.exit();
   }

})();
