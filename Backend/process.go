package main 

import(
	"log"
	"string"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql" 
)

var ctx = context.Background()

func main(){
	username := "root"
	password := "root"
	host := "127.0.0.1"
	port1 := "3306"
	port2 := "3307"
	port3 := "3308"
	dbname1 := "common_db"
	dbname2:="home_labor_db"
	dbname3:="contractors_master"
	dsn1 := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", username, password, host, port1, dbname1)
	dsn2 := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", username, password, host, port2, dbname2)
	dsn3 := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", username, password, host, port3, dbname3)
	
	// connecting with the common database for all users 
	common,err := sql.Open("mysql", dsn1)
	if err != nil {
		log.Fatal("MySQL connection failed:", err)
	}
	if err := db.Ping(); err != nil {
		log.Fatal("MySQL ping failed:", err)
	}

	// connecting  with the database of homowners and labours
	handlab,err := sql.Open("mysql", dsn2)
	if err != nil {
		log.Fatal("MySQL connection failed:", err)
	}
	if err := db.Ping(); err != nil {
		log.Fatal("MySQL ping failed:", err)
	}

	// connecting with the database of the contractors where their data will only be stored 
	contrator,err := sql.Open("mysql", dsn3)
	if err != nil {
		log.Fatal("MySQL connection failed:", err)
	}
	if err := db.Ping(); err != nil {
		log.Fatal("MySQL ping failed:", err)
	}

	defer common.close()
	defer handlab.close()
	defer contractors.close()
	r := gin.Default() // Logger + Recovery middleware included

	// --- Routes ---
	r.POST("/register/initital", register(common))
	r.POST("/register/details",registerdetails(common,contractors,handlab))
	r.GET("/worker/attendace",)

	// --- Run server ---
	portToUse := "8080"
	log.Printf("Go worker running at :%s\n", portToUse)
	if err := r.Run(":" + portToUse); err != nil {
		log.Fatal("Failed to start Gin server:", err)
	}
	
}

func register(common *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var data map[string]string
		if err := c.ShouldBindJSON(&data); err != nil {
			c.JSON(400, gin.H{"error": "invalid JSON"})
			return
		}

		reference_id :=data[" reference_id"]
        name := data["name"]
        dob := data["dob"]
        gender := data["gender"]
        address := data["address"]

		query=`insert into users(refrence_id,name,dob,gender,address) values(?,?,?,?,?)`

		_,err=common.Exec(query,reference_id,name,dob,gender,address)
		if err!=nil
		{
			log.Printf("Unable to add data to the database")
			c.JSON(500,gin.h{"error": "Failed to save data to the database"})
		}
		c.JSON(201, gin.H{
			"status":  "success",
			"message": "Data successfully added to common database",
		})
	}
}

func registerdetails(common *sql.DB,contractors *sql.DB, handlab sql.DB )gin.HandlerFunc{
	return func(c *gin.Context) {
		var data map[string]string
		if err := c.ShouldBindJSON(&data); err != nil {
			c.JSON(400, gin.H{"error": "invalid JSON"})
			return
		}
		refrence_id := data["refrence_id"]
		phone := ["phone"]
		email := ["email"]
		password := ["password"]
		query := `update table users set phone= ? , email= ? , password = ? , rating = 100 where refrence_id=?`
		_,err= common.Exec(query,phone,email,password,reference_id)
		query=`create table ? ()`

   }
}