
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Missing MONGODB_URI in .env.local');
  process.exit(1);
}

const practicals = [
  {
    title: "Practical 2: Data Frames and Basic Data PreProcessing",
    code: `import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
ds = pd.read_csv('customers-100.csv')
print("Data Head:\\n",ds.head())
print("Data Describe:\\n",ds.describe())
X = ds.iloc[:, :-1].values
Y = ds.iloc[:, 3].values
print("\\nInput",X)
print("\\nOutput",Y)

# handling missing values
from sklearn.impute import SimpleImputer
# Use 'most_frequent' for non-numeric colums
imputer = SimpleImputer(missing_values = np.nan, strategy = 'most_frequent')
imputer = imputer.fit(X[:, 1:3])
X[:, 1:3] = imputer.transform(X[:, 1:3])
print("\\n New Input with Most Frequent value for NaN:",X)

# Outliers
import sklearn
from sklearn.datasets import load_diabetes
import pandas as pd
import matplotlib.pyplot as plt
db = load_diabetes()
column_name = db.feature_names
df_db = pd.DataFrame(db.data)
df_db.columns = column_name
df_db.head()

import seaborn as sns
sns.boxplot(x=df_db['bmi'])
import numpy as np
print(np.where(df_db['bmi']>0.12))
#sorting
display(df_db)
sorted = df_db.sort_values(by=['age'])
display(sorted)
#filtering rows
a = df_db.query('age>0')
display(a)
#filtering columns
b = df_db.filter(['age','bp'])
display(b)
#grouping data
g = df_db.groupby('age')
g.first()`
  },
  {
    title: "Practical 3: Feature Scaling and Documentation",
    code: `import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler

data = {
    "Age": [22, 25, 30, 28, 35],
    "Salary": [25000, 30000, 40000, 35000, 50000],
    "City": ["Mumbai", "Delhi", "Mumbai", "Chennai", "Delhi"]
}

df = pd.DataFrame(data)

scaler1 = StandardScaler()
df[["Age_standardized", "Salary_standardized"]] = scaler1.fit_transform(df[["Age", "Salary"]])

scaler2 = MinMaxScaler()
df[["Age_normalized", "Salary_normalized"]] = scaler2.fit_transform(df[["Age", "Salary"]])

df = pd.get_dummies(df, columns=["City"])

print(df)`
  },
  {
    title: "Practical 4: Hypotheses Testing",
    code: `import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

np.random.seed(42)

sample1 = np.random.normal(loc=10, scale=2, size=30)
sample2 = np.random.normal(loc=10, scale=2, size=30)

t_statistic, p_value = stats.ttest_ind(sample1, sample2)

alpha = 0.05

print("Result of Two-Sample t-test")
print(f"t-statistic: {t_statistic}")
print(f"p-value: {p_value}")
print(f"Degree of Freedom: {len(sample1) + len(sample2) - 2}")

plt.figure(figsize=(10, 6))
plt.hist(sample1, alpha=0.5, label='Sample 1')
plt.hist(sample2, alpha=0.5, label='Sample 2')

plt.axvline(np.mean(sample1), linestyle='dashed', linewidth=2, label='Mean Sample 1')
plt.axvline(np.mean(sample2), linestyle='dashed', linewidth=2, label='Mean Sample 2')

plt.title('Distributions of Sample 1 and Sample 2')
plt.xlabel('Value')
plt.ylabel('Frequency')
plt.legend()

plt.show()

if p_value < alpha:
    print("Conclusion: Reject the null hypothesis.")
    if np.mean(sample1) > np.mean(sample2):
        print("Interpretation: Mean of Sample 1 is significantly higher than Sample 2.")
    else:
        print("Interpretation: Mean of Sample 2 is significantly higher than Sample 1.")
else:
    print("Conclusion: Fail to reject the null hypothesis.")
    print("Interpretation: There is no significant difference between the sample means.")`
  },
  {
    title: "Practical 5: ANOVA (Analysis of Variance)",
    code: `import scipy.stats as stats
from statsmodels.stats.multicomp import pairwise_tukeyhsd

group1 = [23, 25, 29, 34, 30]
group2 = [19, 20, 22, 25, 24]
group3 = [15, 18, 20, 21, 47]
group4 = [28, 24, 26, 30, 29]

all_data = group1 + group2 + group3 + group4

group_labels = (
    ['Group1'] * len(group1)
    + ['Group2'] * len(group2)
    + ['Group3'] * len(group3)
    + ['Group4'] * len(group4)
)

f_statistic, p_value = stats.f_oneway(group1, group2, group3, group4)

print("One-way ANOVA:")
print("F-statistic:", f_statistic)
print("P-value:", p_value)

tukey_result = pairwise_tukeyhsd(all_data, group_labels)

print("\\nTukey-Kramer Post-hoc test:")
print(tukey_result)`
  },
  {
    title: "Practical 6: Regressions and Its Types",
    code: `import numpy as np
import pandas as pd
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
housing = fetch_california_housing()
housing_df = pd.DataFrame(data=housing.data, columns=housing.feature_names)
print(housing_df)
housing_df['PRICE'] = housing.target

# Simple Linear Regression
x = housing_df[['AveRooms']]
y = housing_df[['PRICE']]
x_train, X_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)
model = LinearRegression()
model.fit(x_train,y_train)
y_pred = model.predict(X_test)
mse = mean_squared_error(y_test,y_pred)
r2 = r2_score(y_test,y_pred)
print("Mean Squared Error:" ,mse)
print("R-squared",r2)
print("Intercept", model.intercept_)
print("Coefficients", model.coef_)

# Multiple Linear Regression
x = housing_df.drop('PRICE', axis=1)
y = housing_df['PRICE']
x_train,X_test,y_train,y_test = train_test_split(x,y,test_size=0.2,random_state=42)
model = LinearRegression()
model.fit(x_train,y_train)
y_pred = model.predict(X_test)
mse = mean_squared_error(y_test,y_pred)
r2 = r2_score(y_test,y_pred)
print("Mean Squared Error:" ,mse)
print("R-squared",r2)
print("Intercept", model.intercept_)
print("Coefficients", model.coef_)`
  },
  {
    title: "Practical 7: Logistic Regression and Decision Tree",
    code: `import numpy as np
import pandas as pd
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, classification_report

iris = load_iris()

iris_df = pd.DataFrame(
    data=np.c_[iris['data'], iris['target']],
    columns=iris['feature_names'] + ['target']
)


binary_df = iris_df[iris_df['target'] != 2]

X = binary_df.drop('target', axis=1)
y = binary_df['target']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Logistic Regression
logistic_model = LogisticRegression()
logistic_model.fit(X_train, y_train)

y_pred_logistic = logistic_model.predict(X_test)

print("Logistic Regression Metrics:")
print("Accuracy:", accuracy_score(y_test, y_pred_logistic))
print("Precision:", precision_score(y_test, y_pred_logistic))
print("Recall:", recall_score(y_test, y_pred_logistic))
print("\\nClassification Report:")
print(classification_report(y_test, y_pred_logistic))

# Decision Tree
decision_tree_model = DecisionTreeClassifier()
decision_tree_model.fit(X_train, y_train)

y_pred_tree = decision_tree_model.predict(X_test)

print("\\nDecision Tree Metrics:")
print("Accuracy:", accuracy_score(y_test, y_pred_tree))
print("Precision:", precision_score(y_test, y_pred_tree))
print("Recall:", recall_score(y_test, y_pred_tree))
print("\\nClassification Report:")
print(classification_report(y_test, y_pred_tree))`
  },
  {
    title: "Practical 8: K-Means Clustering",
    code: `import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.datasets import load_iris
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

iris = load_iris()
iris_df = pd.DataFrame(data=np.c_[iris['data'], iris['target']],
                       columns=iris['feature_names'] + ['target'])

X = iris_df.drop('target', axis=1)

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

wcss = []
for i in range(1, 11):
    kmeans = KMeans(n_clusters=i, init='k-means++', random_state=42)
    kmeans.fit(X_scaled)
    wcss.append(kmeans.inertia_)

plt.figure(figsize=(8, 6))
plt.plot(range(1, 11), wcss, marker='o', linestyle='--')
plt.title("Elbow Method")
plt.xlabel("Number of Clusters")
plt.ylabel("WCSS")
plt.show()

kmeans = KMeans(n_clusters=3, init='k-means++', random_state=42)
kmeans.fit(X_scaled)

iris_df['cluster'] = kmeans.labels_

print("\\nCluster Characteristics:\\n")
for cluster in sorted(iris_df['cluster'].unique()):
    print(f"\\nCluster {cluster}:")
    print(iris_df[iris_df['cluster'] == cluster].describe())`
  },
  {
    title: "Practical 9: Principal Component Analysis",
    code: `import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.datasets import load_iris
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans


iris = load_iris()
iris_df = pd.DataFrame(data=np.c_[iris['data'], iris['target']],
                       columns=iris['feature_names'] + ['target'])

X = iris_df.drop('target', axis=1)


scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)


pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

kmeans = KMeans(n_clusters=3, init='k-means++', random_state=42)
kmeans.fit(X_pca)

centroids = kmeans.cluster_centers_
labels = kmeans.labels_


plt.figure(figsize=(8, 6))
plt.scatter(X_pca[:, 0], X_pca[:, 1], c=labels, cmap='viridis', s=60, alpha=0.7)
plt.scatter(centroids[:, 0], centroids[:, 1], marker='o', c='red',
            s=200, edgecolor='black')

plt.title("K-Means Clustering (PCA Transformed Data)")
plt.xlabel("Principal Component 1")
plt.ylabel("Principal Component 2")
plt.colorbar()
plt.show()


cluster_df = iris_df.copy()
cluster_df['cluster'] = labels

print("\\nCluster Analysis:")
for cluster in sorted(cluster_df['cluster'].unique()):
    print(f"\\nCluster {cluster}:")
    print(cluster_df[cluster_df['cluster'] == cluster].describe())`
  },
  {
    title: "Practical 10: Data Visualization and Storytelling",
    code: `import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import pandas as pd

data = {
    'gender': ['Male', 'Female', 'Male', 'Female', 'Male'],
    'churn': ['Yes', 'No', 'No', 'Yes', 'Yes'],
    'age': [25, 30, 35, 40, 45],
    'service_churn': ['A', 'B', 'A', 'B', 'A'],
    'tenure': [2, 5, 7, 3, 8],
    'feature1': [10, 15, 20, 25, 30],
    'feature2': [5, 8, 12, 18, 22],
    'cluster': ['A', 'B', 'A', 'B', 'A']
}


df = pd.DataFrame(data)


sns.countplot(data=df, x='gender', hue='churn')
plt.show()


# Churn Rate by Age Group
fig = px.histogram(
    df,
    x='age',
    color='churn',
    nbins=20,
    histnorm='percent'
)

fig.update_layout(
    title='Churn Rate by Age Group',
    xaxis_title='Age',
    yaxis_title='% of Customers'
)

fig.show()

# Churn Rate by service Type
df['churn_numeric'] = df['churn'].map({'No': 0, 'Yes': 1})
service_churn = df.groupby('service_churn')['churn_numeric'].mean()
plt.pie(service_churn,labels=service_churn.index, autopct='%1.1f%%')
plt.title('Churn Rate by service Type')
plt.show()

# Correlation Matrix
correlation_matrix = df.corr(numeric_only=True)
sns.heatmap(correlation_matrix,annot=True,cmap='coolwarm')
plt.title('Correlation Matrix')
plt.show()

# Customer Tenure vs. Churn
fig = px.scatter(df,x='tenure',y='churn',color='churn')
fig.update_layout(title='Customer Tenure vs. Churn', xaxis_title='Churn(1=Yes,0=No)')
fig.show()

# Customer Segmentation
fig = px.scatter(df,x='feature1',y='feature2',color='cluster')
fig.update_layout(title="Customer Segmentation")
fig.show()`
  }
];

async function seed() {
  const client = new MongoClient(uri!);
  try {
    await client.connect();
    const db = client.db('vault');
    const collection = db.collection('vaultitems3');

    console.log('Inserting practicals...');

    const docs = practicals.map(p => ({
      ...p,
      imageId: null,
      createdAt: new Date()
    }));

    const result = await collection.insertMany(docs);
    console.log(`Successfully inserted ${result.insertedCount} items into vaultitems3.`);
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await client.close();
  }
}

seed();
