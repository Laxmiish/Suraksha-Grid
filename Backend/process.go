package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
	"github.com/robfig/cron/v3"
)

var commonDB *sql.DB
var contractorDB *sql.DB

func main() {
	var err error
	username, password, host := "root", "root", "127.0.0.1"
	
	dsn1 := fmt.Sprintf("%s:%s@tcp(%s:3306)/common_db?parseTime=true", username, password, host)
	dsn2 := fmt.Sprintf("%s:%s@tcp(%s:3306)/contractors_master?parseTime=true", username, password, host)

	commonDB, err = sql.Open("mysql", dsn1)
	if err != nil || commonDB.Ping() != nil { log.Fatal("Common DB failed:", err) }
	defer commonDB.Close()

	contractorDB, err = sql.Open("mysql", dsn2)
	if err != nil || contractorDB.Ping() != nil { log.Fatal("Contractor DB failed:", err) }
	defer contractorDB.Close()

	c := cron.New()
	c.AddFunc("0 0 * * *", runDailyAttendancePulse)
	c.Start()

	r := gin.Default()

	r.POST("/register", registerHandler)
	r.POST("/login", loginHandler)
	r.GET("/worker/benefits/:ref_id", getEligibleBenefits)
	r.POST("/contractor/mark-absent", markAbsent)

	log.Println("Go Engine running intensely on port 8080")
	r.Run(":8080")
}

// 1. Unified Registration (Now saving DOB and Gender from the XML)
func registerHandler(c *gin.Context) {
	var data map[string]interface{}
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON"})
		return
	}

	query := `INSERT INTO users (reference_id, name, dob, gender, phone, email, password_hash, role, state, rating) 
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 100) 
			  ON DUPLICATE KEY UPDATE phone=?, email=?, password_hash=?, role=?`
			  
	_, err := commonDB.Exec(query, 
		data["reference_id"], data["name"], data["dob"], data["gender"], 
		data["mobile"], data["email"], data["password"], data["role"], data["state"],
		data["mobile"], data["email"], data["password"], data["role"])
		
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

// 2. Login verification lookup
func loginHandler(c *gin.Context) {
	var data map[string]string
	c.ShouldBindJSON(&data)

	var refID, hash, role, name string
	query := `SELECT reference_id, name, password_hash, role FROM users WHERE phone=?`
	err := commonDB.QueryRow(query, data["mobile"]).Scan(&refID, &name, &hash, &role)
	
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"reference_id": refID, "name": name, "password_hash": hash, "role": role})
}

// 3. THE SENIORITY LOGIC
func getEligibleBenefits(c *gin.Context) {
	refID := c.Param("ref_id")

	var totalDays int
	queryDays := `SELECT COUNT(*) FROM attendance_logs WHERE worker_reference_id=? AND status='PRESENT'`
	err := contractorDB.QueryRow(queryDays, refID).Scan(&totalDays)
	if err != nil { totalDays = 0 }

	// 90 days of logged work = 1 year of statutory BOCW eligibility
	seniorityYears := totalDays / 90

	var workerState string
	queryState := `SELECT state FROM users WHERE reference_id=?`
	err = commonDB.QueryRow(queryState, refID).Scan(&workerState)
	if err != nil { workerState = "Uttar Pradesh" }

	queryBenefits := `SELECT benifitname, benifittype, minimumyear, conditions 
					  FROM benefits WHERE state=? AND minimumyear <= ?`
	rows, err := commonDB.Query(queryBenefits, workerState, seniorityYears)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch benefits"})
		return
	}
	defer rows.Close()

	var eligibleBenefits []map[string]interface{}
	for rows.Next() {
		var name, bType, conditions string
		var minYear int
		rows.Scan(&name, &bType, &minYear, &conditions)
		eligibleBenefits = append(eligibleBenefits, map[string]interface{}{
			"benefit_name": name, "type": bType, "years_required": minYear, "conditions": conditions,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"seniority_stats": map[string]interface{}{
			"total_days_worked": totalDays,
			"calculated_bocw_years": seniorityYears,
			"days_to_next_tier": 90 - (totalDays % 90),
		},
		"eligible_schemes": eligibleBenefits,
	})
}

// 4. Contractor marks absent
func markAbsent(c *gin.Context) {
	var data map[string]interface{}
	c.ShouldBindJSON(&data)

	query := `UPDATE attendance_logs SET status='ABSENT' WHERE jobsite_id=? AND worker_reference_id=? AND date=?`
	_, err := contractorDB.Exec(query, data["jobsite_id"], data["worker_reference_id"], data["date"])
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update attendance"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "Marked Absent"})
}

func runDailyAttendancePulse() {
	log.Println("Running Daily Attendance Pulse (Default-Present)...")
	rows, err := contractorDB.Query("SELECT jobsite_id, worker_reference_id, daily_wage FROM active_links WHERE active = 1")
	if err != nil { return }
	defer rows.Close()

	insertQuery := `INSERT IGNORE INTO attendance_logs (jobsite_id, worker_reference_id, date, status, payout_amount) VALUES (?, ?, CURDATE(), 'PRESENT', ?)`
	for rows.Next() {
		var jobsiteID int
		var workerID string
		var wage float64
		rows.Scan(&jobsiteID, &workerID, &wage)
		contractorDB.Exec(insertQuery, jobsiteID, workerID, wage)
	}
	log.Println("Pulse Complete.")
}