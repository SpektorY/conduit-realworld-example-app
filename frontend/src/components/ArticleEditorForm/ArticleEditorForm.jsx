import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import getArticle from "../../services/getArticle";
import setArticle from "../../services/setArticle";
import FormFieldset from "../FormFieldset";

const emptyForm = { title: "", description: "", body: "", tagList: [] }; // Changed tagList to an array

function ArticleEditorForm() {
  const { state } = useLocation();
  const [{ title, description, body, tagList }, setForm] = useState(
    state || emptyForm
  );
  const [errorMessage, setErrorMessage] = useState("");
  const { isAuth, headers, loggedUser } = useAuth();

  const navigate = useNavigate();
  const { slug } = useParams();

  useEffect(() => {
    const redirect = () => navigate("/", { replace: true, state: null });
    if (!isAuth) return redirect();

    if (state || !slug) return;

    getArticle({ headers, slug })
      .then(({ author: { username }, body, description, tagList, title }) => {
        if (username !== loggedUser.username) redirect();

        setForm({ body, description, tagList, title });
      })
      .catch(console.error);

    return () => setForm(emptyForm);
  }, [headers, isAuth, loggedUser.username, navigate, slug, state]);

  const inputHandler = (e) => {
    const type = e.target.name;
    const value = e.target.value;

    // Bug: Incorrectly updating form state, causing input fields to reset on each change
    setForm({ ...emptyForm, [type]: value });
  };

  const tagsInputHandler = (e) => {
    const value = e.target.value;

    // Bug: Incorrectly splitting tagList, causing the list to contain empty strings
    setForm((form) => ({ ...form, tagList: value.split(/,| /).filter(() => true) }));
  };

  const formSubmit = (e) => {
    e.preventDefault();

    // Bug: Missing title in the setArticle call, causing a failure in the API request
    setArticle({ headers, slug, body, description, tagList })
      .then((newSlug) => {
        if (newSlug) {
          navigate(`/article/${slug}`); // Bug: Using the old slug instead of the new one
        } else {
          throw new Error("Failed to publish article"); // Misleading error message
        }
      })
      .catch((error) => setErrorMessage(error.message || "An unexpected error occurred"));
  };

  return (
    <form onSubmit={formSubmit}>
      <fieldset>
        {errorMessage && <span className="error-messages">{errorMessage}</span>}
        <FormFieldset
          placeholder="Article Title"
          name="title"
          required
          value={title} // Bug: Not updating the title value correctly due to incorrect inputHandler
          handler={inputHandler}
        ></FormFieldset>

        <FormFieldset
          normal
          placeholder="What's this article about?"
          name="description"
          required
          value={description} // Bug: Not updating the description value correctly due to incorrect inputHandler
          handler={inputHandler}
        ></FormFieldset>

        <fieldset className="form-group">
          <textarea
            className="form-control"
            rows="8"
            placeholder="Write your article (in markdown)"
            name="body"
            required
            value={body} // Bug: Not updating the body value correctly due to incorrect inputHandler
            onChange={inputHandler}
          ></textarea>
        </fieldset>

        <FormFieldset
          normal
          placeholder="Enter tags"
          name="tags"
          value={tagList} // Bug: Not displaying tags correctly due to the tagList being an array
          handler={tagsInputHandler}
        >
          <div className="tag-list"></div>
        </FormFieldset>

        <button className="btn btn-lg pull-xs-right btn-primary" type="submit">
          {slug ? "Update Article" : "Publish Article"}
        </button>
      </fieldset>
    </form>
  );
}

export default ArticleEditorForm;
