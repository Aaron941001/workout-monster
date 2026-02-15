foods_data = [
    # Proteins
    {"name": "Chicken Breast", "name_zh": "雞胸肉", "calories": 165, "protein_g": 31, "carbs_g": 0, "fat_g": 3.6, "serving_size": "100g", "serving_size_zh": "100克", "category": "protein"},
    {"name": "Eggs", "name_zh": "雞蛋", "calories": 155, "protein_g": 13, "carbs_g": 1.1, "fat_g": 11, "serving_size": "2 large", "serving_size_zh": "2顆大", "category": "protein"},
    {"name": "Whey Protein", "name_zh": "乳清蛋白", "calories": 120, "protein_g": 24, "carbs_g": 3, "fat_g": 1.5, "serving_size": "1 scoop (30g)", "serving_size_zh": "1匙 (30克)", "category": "protein"},
    {"name": "Salmon", "name_zh": "鮭魚", "calories": 206, "protein_g": 22, "carbs_g": 0, "fat_g": 13, "serving_size": "100g", "serving_size_zh": "100克", "category": "protein"},
    {"name": "Tofu", "name_zh": "豆腐", "calories": 76, "protein_g": 8, "carbs_g": 1.9, "fat_g": 4.8, "serving_size": "100g", "serving_size_zh": "100克", "category": "protein"},
    {"name": "Greek Yogurt", "name_zh": "希臘優格", "calories": 59, "protein_g": 10, "carbs_g": 3.6, "fat_g": 0.4, "serving_size": "100g", "serving_size_zh": "100克", "category": "protein"},
    {"name": "Tuna", "name_zh": "鮪魚", "calories": 132, "protein_g": 28, "carbs_g": 0, "fat_g": 1.3, "serving_size": "100g", "serving_size_zh": "100克", "category": "protein"},
    {"name": "Beef (Lean)", "name_zh": "牛肉(瘦)", "calories": 250, "protein_g": 26, "carbs_g": 0, "fat_g": 15, "serving_size": "100g", "serving_size_zh": "100克", "category": "protein"},
    {"name": "Pork Tenderloin", "name_zh": "豬里肌", "calories": 143, "protein_g": 26, "carbs_g": 0, "fat_g": 3.5, "serving_size": "100g", "serving_size_zh": "100克", "category": "protein"},
    
    # Carbs
    {"name": "White Rice", "name_zh": "白飯", "calories": 130, "protein_g": 2.7, "carbs_g": 28, "fat_g": 0.3, "serving_size": "100g cooked", "serving_size_zh": "100克熟飯", "category": "carbs"},
    {"name": "Brown Rice", "name_zh": "糙米", "calories": 112, "protein_g": 2.6, "carbs_g": 24, "fat_g": 0.9, "serving_size": "100g cooked", "serving_size_zh": "100克熟飯", "category": "carbs"},
    {"name": "Oats", "name_zh": "燕麥", "calories": 389, "protein_g": 16.9, "carbs_g": 66, "fat_g": 6.9, "serving_size": "100g dry", "serving_size_zh": "100克乾燥", "category": "carbs"},
    {"name": "Sweet Potato", "name_zh": "地瓜", "calories": 86, "protein_g": 1.6, "carbs_g": 20, "fat_g": 0.1, "serving_size": "100g", "serving_size_zh": "100克", "category": "carbs"},
    {"name": "Whole Wheat Bread", "name_zh": "全麥麵包", "calories": 247, "protein_g": 13, "carbs_g": 41, "fat_g": 3.4, "serving_size": "100g", "serving_size_zh": "100克", "category": "carbs"},
    {"name": "Pasta", "name_zh": "義大利麵", "calories": 131, "protein_g": 5, "carbs_g": 25, "fat_g": 1.1, "serving_size": "100g cooked", "serving_size_zh": "100克熟麵", "category": "carbs"},
    {"name": "Quinoa", "name_zh": "藜麥", "calories": 120, "protein_g": 4.4, "carbs_g": 21, "fat_g": 1.9, "serving_size": "100g cooked", "serving_size_zh": "100克熟", "category": "carbs"},
    {"name": "Potato", "name_zh": "馬鈴薯", "calories": 77, "protein_g": 2, "carbs_g": 17, "fat_g": 0.1, "serving_size": "100g", "serving_size_zh": "100克", "category": "carbs"},
    
    # Fats
    {"name": "Olive Oil", "name_zh": "橄欖油", "calories": 884, "protein_g": 0, "carbs_g": 0, "fat_g": 100, "serving_size": "100ml", "serving_size_zh": "100毫升", "category": "fats"},
    {"name": "Almonds", "name_zh": "杏仁", "calories": 579, "protein_g": 21, "carbs_g": 22, "fat_g": 50, "serving_size": "100g", "serving_size_zh": "100克", "category": "fats"},
    {"name": "Peanut Butter", "name_zh": "花生醬", "calories": 588, "protein_g": 25, "carbs_g": 20, "fat_g": 50, "serving_size": "100g", "serving_size_zh": "100克", "category": "fats"},
    {"name": "Avocado", "name_zh": "酪梨", "calories": 160, "protein_g": 2, "carbs_g": 8.5, "fat_g": 15, "serving_size": "100g", "serving_size_zh": "100克", "category": "fats"},
    {"name": "Walnuts", "name_zh": "核桃", "calories": 654, "protein_g": 15, "carbs_g": 14, "fat_g": 65, "serving_size": "100g", "serving_size_zh": "100克", "category": "fats"},
    {"name": "Cashews", "name_zh": "腰果", "calories": 553, "protein_g": 18, "carbs_g": 30, "fat_g": 44, "serving_size": "100g", "serving_size_zh": "100克", "category": "fats"},
    
    # Vegetables
    {"name": "Broccoli", "name_zh": "花椰菜", "calories": 34, "protein_g": 2.8, "carbs_g": 7, "fat_g": 0.4, "serving_size": "100g", "serving_size_zh": "100克", "category": "vegetables"},
    {"name": "Spinach", "name_zh": "菠菜", "calories": 23, "protein_g": 2.9, "carbs_g": 3.6, "fat_g": 0.4, "serving_size": "100g", "serving_size_zh": "100克", "category": "vegetables"},
    {"name": "Tomato", "name_zh": "番茄", "calories": 18, "protein_g": 0.9, "carbs_g": 3.9, "fat_g": 0.2, "serving_size": "100g", "serving_size_zh": "100克", "category": "vegetables"},
    {"name": "Cucumber", "name_zh": "小黃瓜", "calories": 15, "protein_g": 0.7, "carbs_g": 3.6, "fat_g": 0.1, "serving_size": "100g", "serving_size_zh": "100克", "category": "vegetables"},
    {"name": "Bell Pepper", "name_zh": "甜椒", "calories": 31, "protein_g": 1, "carbs_g": 6, "fat_g": 0.3, "serving_size": "100g", "serving_size_zh": "100克", "category": "vegetables"},
    {"name": "Carrots", "name_zh": "紅蘿蔔", "calories": 41, "protein_g": 0.9, "carbs_g": 10, "fat_g": 0.2, "serving_size": "100g", "serving_size_zh": "100克", "category": "vegetables"},
    
    # Fruits
    {"name": "Banana", "name_zh": "香蕉", "calories": 89, "protein_g": 1.1, "carbs_g": 23, "fat_g": 0.3, "serving_size": "100g", "serving_size_zh": "100克", "category": "fruits"},
    {"name": "Apple", "name_zh": "蘋果", "calories": 52, "protein_g": 0.3, "carbs_g": 14, "fat_g": 0.2, "serving_size": "100g", "serving_size_zh": "100克", "category": "fruits"},
    {"name": "Strawberries", "name_zh": "草莓", "calories": 32, "protein_g": 0.7, "carbs_g": 7.7, "fat_g": 0.3, "serving_size": "100g", "serving_size_zh": "100克", "category": "fruits"},
    {"name": "Blueberries", "name_zh": "藍莓", "calories": 57, "protein_g": 0.7, "carbs_g": 14, "fat_g": 0.3, "serving_size": "100g", "serving_size_zh": "100克", "category": "fruits"},
    {"name": "Orange", "name_zh": "柳橙", "calories": 47, "protein_g": 0.9, "carbs_g": 12, "fat_g": 0.1, "serving_size": "100g", "serving_size_zh": "100克", "category": "fruits"},
    {"name": "Mango", "name_zh": "芒果", "calories": 60, "protein_g": 0.8, "carbs_g": 15, "fat_g": 0.4, "serving_size": "100g", "serving_size_zh": "100克", "category": "fruits"},
    
    # Dairy
    {"name": "Milk (Whole)", "name_zh": "全脂牛奶", "calories": 61, "protein_g": 3.2, "carbs_g": 4.8, "fat_g": 3.3, "serving_size": "100ml", "serving_size_zh": "100毫升", "category": "protein"},
    {"name": "Milk (Skim)", "name_zh": "脫脂牛奶", "calories": 34, "protein_g": 3.4, "carbs_g": 5, "fat_g": 0.1, "serving_size": "100ml", "serving_size_zh": "100毫升", "category": "protein"},
    {"name": "Cheese (Cheddar)", "name_zh": "切達起司", "calories": 402, "protein_g": 25, "carbs_g": 1.3, "fat_g": 33, "serving_size": "100g", "serving_size_zh": "100克", "category": "protein"},
    {"name": "Cottage Cheese", "name_zh": "茅屋起司", "calories": 98, "protein_g": 11, "carbs_g": 3.4, "fat_g": 4.3, "serving_size": "100g", "serving_size_zh": "100克", "category": "protein"},
]
